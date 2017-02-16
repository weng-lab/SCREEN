#pragma once

#include <iomanip>
#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <algorithm>
#include <mutex>

#include <json/json.h>
#include <json/reader.h>
#include <boost/optional.hpp>
#include <boost/filesystem.hpp>
#include <boost/log/trivial.hpp>
#include <boost/log/utility/setup.hpp>

#include <zi/concurrency/concurrency.hpp>
#include <zi/parallel/algorithm.hpp>
#include <zi/parallel/numeric.hpp>

#include "cpp/utility.hpp"
#include "cpp/string_utils.hpp"
#include "cpp/files.hpp"
#include "cpp/gzip_reader.hpp"
#include "cpp/tictoc.hpp"

#include "ranks.hpp"
#include "peak.hpp"

namespace bib {

  namespace bfs = boost::filesystem;

  using MpNameToGenes = std::unordered_map<std::string, std::vector<Gene>>;

  class Peaks : public std::unordered_map<std::string, Peak> {
    std::vector<std::string> accessions_;

  public:
    void setAccessions() {
      accessions_.clear();
      accessions_.reserve(size());
      for(auto& kv : *this){
	accessions_.push_back(kv.first);
      }
      zi::sort(accessions_.begin(), accessions_.end());
    }

    const auto& accessions() const { return accessions_; }
  };

  struct SignalLine {
    int32_t rank;
    float signal;
    float zscore;

    float avg_zscore;
    float left_zscore;
    float right_zscore;
  };

  class SignalFile {
    bfs::path fnp_;
    std::string fn_;

    std::string conservation_;

    std::unordered_map<std::string, SignalLine> lines_;

  public:
    SignalFile()
    {}

    SignalFile(const bfs::path fnp)
      : fnp_(fnp)
    {
      fn_ = fnp.filename().string();
    }

    void reserve(size_t s){
      lines_.reserve(s);
    }

    const std::string& Conservation() const {
      return conservation_;
    }

    void setSignalLine(const auto& toks){
      SignalLine s;
      if(4 == toks.size()){
	// MP-2175312-100.000000  -0.08  0.95  635383
	// mpName                 zscore signal rank
	s.zscore = std::stof(toks[1]);
	s.signal = std::stof(toks[2]);
	s.rank = std::stoi(toks[3]);
      } else if(3 == toks.size()){
	// MP-1034943-3.371610     0.0183822       611359
	s.signal = std::stof(toks[1]);
	s.rank = std::stoi(toks[2]);
      } else if(5 == toks.size()){
	// MP-2175312-100.000000  -0.70  1060099  -0.08  -1.33
	// mpName                 avgZ   rank     leftZ  rightZ
	s.avg_zscore = std::stof(toks[1]);
	s.rank = std::stoi(toks[2]);
	s.left_zscore = std::stof(toks[3]);
	s.right_zscore = std::stof(toks[4]);
      } else {
	throw std::runtime_error("invalid num toks");
      }
      lines_[toks[0]] = std::move(s);
    }

    bool hasMpName(const std::string& mpName) const {
      return bib::in(mpName, lines_);
    }

    bool isConservation() const {
      return bib::str::startswith(fn_, "mm10.60way.");
    }

  };

  class HumanMousePaths {
  public:
    const std::string genome_;
    const std::string chr_;
    const bfs::path base_;
    bfs::path path_;

    HumanMousePaths(std::string assembly, const std::string chr, bfs::path base)
      : genome_(assembly)
      , chr_(chr)
      , base_(base)
    {
      path_ = base_ / chr_;
    }

    bfs::path allGenes(){ return path_ / "all_cre_genes.bed.gz"; }
    bfs::path pcGenes(){ return path_ / "pc_cre_genes.bed.gz"; }
    bfs::path peaks(){ return path_ / "masterPeaks.bed"; }
    bfs::path tads(){ return path_ / "TADs.txt"; }
    bfs::path geneIDfnp(){ return base_ / "ensebleToID.txt"; }
    bfs::path signalDir(){
      return path_ / "signal-output";
    }

    bfs::path listFile(const std::string name){
      return base_ / (name + "-List.txt");
    }
  };

  template <typename T>
  class GetData {
    T paths_;

    std::unordered_map<std::string, uint32_t> geneNameToID_;

  public:
    GetData(T paths)
      : paths_(paths)
    {
      {
	bfs::path geneIDfnp = paths_.geneIDfnp();
	std::cout << "loading gene to ID " << geneIDfnp << std::endl;
	auto lines = bib::files::readStrings(geneIDfnp);
	for(const auto& p : lines){
	  auto toks = bib::str::split(p, ',');
	  geneNameToID_[toks[0]] = std::stoi(toks[2]);
	}
      }
    }

    // chrY    808996  809318  MP-2173311-100.000000   EE0756098
    Peaks peaks(){
      auto lines = bib::files::readStrings(paths_.peaks());
      std::cout << "loading peaks " << paths_.peaks() << std::endl;

      Peaks ret;
      ret.reserve(lines.size());
      for(const auto& p : lines){
	auto toks = bib::str::split(p, '\t');
	auto mpToks = bib::str::split(toks[3], '-');
	ret[toks[4]] = Peak{toks[0],
			    std::stoi(toks[1]),
			    std::stoi(toks[2]),
			    toks[3],
			    mpToks[2],
			    toks[4]};
      }
      std::cout << "loaded " << ret.size() << " peaks\n";
      return ret;
    }

    MpNameToGenes tads(){
      MpNameToGenes ret;

      auto fnp = paths_.tads();
      if(!bfs::exists(fnp)){
	std::cerr << "TADs missing: " << fnp << std::endl;
	return ret;
      }
      auto lines = bib::files::readStrings(fnp);
      std::cout << "loading " << " tads " << fnp << std::endl;

      uint32_t count{0};
      ret.reserve(lines.size());
      for(const auto& p : lines){
	auto toks = bib::str::split(p, '\t');
	auto genes = bib::str::split(toks[1], ',');
	for(const auto& gene : genes){
	  std::string ensembl = gene;
	  bib::string::rtrim(ensembl);
	  ret[toks[0]].emplace_back(Gene{geneNameToID_.at(ensembl), 0});
	}
	++count;
      }
      std::cout << "loaded " << count << " tads\n";
      return ret;

    }


    // 0    1      2      3                   4    5      6      7                     8 9 10
    // chrY,141692,141850,MP-2173235-3.088310,chrY,206151,207788,ENSMUSG00000101796.1 ,.,+,64302
    MpNameToGenes allGenes(){
      return loadGenes(paths_.allGenes(), "all");
    }

    MpNameToGenes pcGenes(){
      return loadGenes(paths_.pcGenes(), "pc");
    }

    MpNameToGenes loadGenes(bfs::path fnp, std::string typ){
      std::cout << "loading " << typ << " genes " << fnp << std::endl;
      auto lines = bib::files::readStrings(fnp);

      std::cout << "found " << lines.size() <<  " lines for " << typ << " genes " << fnp << std::endl;
      uint32_t count{0};
      MpNameToGenes ret;
      ret.reserve(lines.size());
      for(const auto& g : lines){
	auto toks = bib::str::split(g, '\t');
	std::string ensembl = toks[8];
	std::string mp = toks[3];
	bib::string::rtrim(mp);
	bib::string::rtrim(ensembl);
	ret[mp].emplace_back(Gene{geneNameToID_.at(ensembl),
	      std::stoi(toks[10])}); // distance
	++count;
      }
      std::cout << "loaded " << count << " " << typ << " genes\n";
      return ret;
    }

    std::vector<SignalFile> loadSignals(){
      auto dir = bib::files::dir(paths_.signalDir());
      const std::vector<bfs::path> fnps(dir.begin(), dir.end());

      std::cout << "found " << fnps.size() << " signal files"
		<< std::endl;

      std::vector<SignalFile> ret(fnps.size());

#pragma omp parallel for
      for(size_t i = 0; i < fnps.size(); ++i){
	const std::string fn = fnps[i].filename().string();

	if(bib::str::startswith(fn, "mm10.H3K27ac")){
	  continue;
	}

	const std::string fnp = fnps[i].string();

	const auto lines = bib::files::readStrings(fnp);
	SignalFile sf(fnp);
	sf.reserve(lines.size());

	for(const auto& g : lines){
	  auto toks = bib::str::split(g, '\t');
	  if(toks.size() > 5){
	    std::cerr << "too many toks for " << fnp << std::endl;
	    throw std::runtime_error("too many toks");
	  }
	  sf.setSignalLine(toks);
	}
	ret[i] = std::move(sf);
      }
      return ret;
    }

  };

  class DataHelper {
    Peaks& peaks_;

    MpNameToGenes tads_;
    MpNameToGenes allGenes_;
    MpNameToGenes pcGenes_;
    std::vector<SignalFile> signalFiles_;

  public:
    template <typename T>
    DataHelper(T& paths, Peaks& peaks)
      : peaks_(peaks)
    {
      TicToc tt("data load time");
      GetData<T> gd(paths);
      if("hg19" == ZiARG_assembly){
	tads_ = gd.tads();
      }
      allGenes_ = gd.allGenes();
      pcGenes_ = gd.pcGenes();
	
      signalFiles_ = gd.loadSignals();

      peaks_ = gd.peaks();
      peaks_.setAccessions();
    }

    template <typename T>
    void setTads(const std::string& mpName, T& d) const {
    }
    
    template <typename T>
    void setAllGenes(const std::string& mpName, T& d) const {
    }

    template <typename T>
    void setPcGenes(const std::string& mpName, T& d) const {
    }

    template <typename T>
    void setConservation(const std::string& mpName, T& p) const {
    }

    template <typename T>
    void setDnaseOnly(const std::string& mpName, T& p) const {
    }

    template <typename T>
    void setCtcfOnly(const std::string& mpName, T& p) const {
    }

    template <typename T>
    void setCtcfDnase(const std::string& mpName, T& p) const {
    }

    template <typename T>
    void setH3k27acOnly(const std::string& mpName, T& p) const {
    }

    template <typename T>
    void setH3k27acDnase(const std::string& mpName, T& p) const {
    }

    template <typename T>
    void setH3k4me3Only(const std::string& mpName, T& p) const {
    }

    template <typename T>
    void setH3k4me3Dnase(const std::string& mpName, T& p) const {
    }
    
  };
  
} // namespace bib
