#pragma once

#include <boost/filesystem.hpp>
#include <boost/log/trivial.hpp>
#include <boost/log/utility/setup.hpp>
#include <mutex>

#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <algorithm>
#include <json/json.h>
#include <json/reader.h>
#include <array>
#include <boost/optional.hpp>
#include <zi/concurrency/concurrency.hpp>
#include <zi/system.hpp>
#include <zi/parallel/algorithm.hpp>
#include <zi/parallel/numeric.hpp>

#include "cpp/utility.hpp"
#include "cpp/string_utils.hpp"
#include "cpp/files.hpp"
#include "cpp/gzip_reader.hpp"
#include "cpp/tictoc.hpp"
#include "cpp/gzstream.hpp"

namespace bib {

  namespace bfs = boost::filesystem;

  struct RankDNase {
    std::string accession_;
    std::string bigwig_;
    uint32_t rank_;
    float signal_;
    float zscore_;

    friend auto& operator<<(std::ostream& s, const RankDNase& r){
      s << r.accession_ << " " << r.bigwig_ << " " << r.rank_
	<< " " << r.signal_ << " " << r.zscore_;
      return s;
    }
  };
  
  struct Gene {
    std::string name;
    uint32_t distance;

    friend bool operator<(const Gene& a, const Gene& b){
      return std::tie(a.distance, a.name) <
	std::tie(b.distance, b.name);
    }

    friend auto& operator<<(std::ostream& s, const Gene& g){
      s << g.name << "\t" << g.distance;
      return s;
    }
  };

  class Peak {
  public:
    std::string chrom;
    uint32_t start;
    uint32_t end;
    std::string mpName;
    std::string negLogP;
    std::string accession;

    std::string genome;
    
    std::vector<Gene> gene_nearest_all;
    std::vector<Gene> gene_nearest_pc;

    // celltype to rank info
    std::unordered_map<std::string, RankDNase> ranksDNase_;
    
    friend auto& operator<<(std::ostream& s, const Peak& p){
      s << p.accession << "\n";
      s << "\tposition: " << p.chrom << ":" << p.start << "-" << p.end << "\n";
      s << "\tall genes:\n";
      for(const auto& g : p.gene_nearest_all){
	s << "\t\t" << g << "\n";
      }
      s << "\tpc genes:\n";
      for(const auto& g : p.gene_nearest_pc){
	s << "\t\t" << g << "\n";
      }
      s << "\tgenome: " << p.genome << "\n";
      s << "\tneg-log-p: " << p.negLogP << "\n";

      s << "\tRanks: DNase:\n";
      for(const auto& kv: p.ranksDNase_){
	s << "\t\t" << kv.first << " " << kv.second << "\n";
      }
      return s;
    }
  };

  using MpNameToGenes = std::unordered_map<std::string, std::vector<Gene>>;

  using Peaks = std::unordered_map<std::string, Peak>;

  struct SignalLine {
    float zscore;
    float avgSignal;
    uint32_t rank;
  };

  struct ExpFileHelper {
    std::string expID_;
    std::string fileID_;

    ExpFileHelper(const std::string& s){
      const auto assayToks = bib::str::split(s, '-');
      expID_ = assayToks[0];
      fileID_ = assayToks[1];
    }

    friend auto& operator<<(std::ostream& s, const ExpFileHelper& e){
      s << e.expID_ << " " << e.fileID_;
      return s;
    }

  };

  struct AssayMetadata {
    std::string expID_;
    std::string fileID_;
    std::string cellType_;

    AssayMetadata()
    {}
    
    template <typename C>
    AssayMetadata(const C& c){
      expID_ = c[0];
      fileID_ = c[1];
      cellType_ = c[2];
    }    
  };
  
  struct AssayMetadataFile {
    bfs::path fnp_;
    std::unordered_map<std::string, AssayMetadata> expIDtoMeta_;
    
    AssayMetadataFile()
    {}

    AssayMetadataFile(const bfs::path fnp)
      : fnp_(fnp)
    {
      auto lines = bib::files::readStrings(fnp);
      for(const auto& p : lines){
	auto toks = bib::str::split(p, '\t');
	expIDtoMeta_[toks[0]] = AssayMetadata(toks);
      }
    }
  };
  
  class AssayInfos {
    // assay ("DNase", "CTCF", etc.) to info
    std::map<std::string, AssayMetadataFile> infos_;
  public:

    AssayInfos()
    {}
    
    template <typename T>
    AssayInfos(T& paths){
      for(const auto& a : {"CTCF", "DNase", "Enhancer",
	    "H3K27ac", "H3K4me3", "Insulator", "Promoter"}){
	auto fnp = paths.listFile(a);
	std::cout << "\tloading " << fnp << "\n";
	infos_[a] = AssayMetadataFile(fnp);
      }
    }
    
    bool isDNaseOnly(const std::string& expID) const {
      return bib::in(expID, infos_.at("DNase").expIDtoMeta_);
    }

    const std::string& cellType(std::string assay, std::string expID) const {
      return infos_.at(assay).expIDtoMeta_.at(expID).cellType_;
    }

    const std::string& cellType(const RankDNase& rd) const {
      return cellType("DNase", rd.accession_);
    }
  };
  
  class SignalFile {
    bfs::path fnp_;
    std::string fn_;

    boost::optional<ExpFileHelper> e1_;
    boost::optional<ExpFileHelper> e2_;

    std::unordered_map<std::string, SignalLine> lines_;

  public:
    SignalFile()
    {}
	  
    SignalFile(const bfs::path fnp)
      : fnp_(fnp)
    {
      fn_ = fnp.filename().string();
      
      if(bib::str::startswith(fn_, "EN")){
	const auto toks = bib::str::split(fn_, '.');

	if(bib::str::startswith(toks[1], "EN")){
	  // 2 assays
	  e1_ = ExpFileHelper(toks[0]);
	  e2_ = ExpFileHelper(toks[1]);
	  //std::cout << *e1_ << " vs " << *e2_ << std::endl;
	  

	} else {
	  // 1 assay
	  e1_ = ExpFileHelper(toks[0]);
	  //std::cout << *e1_ << std::endl;
	  
	}
      } else {
	std::cerr << "unknown file " << fnp << std::endl;
      }
    }

    void setSignalLine(const auto& toks){
      lines_[toks[0]] = SignalLine{std::stof(toks[1]),
				   std::stof(toks[2]),
				   std::stoi(toks[3])};
    }
    
    bool isDNaseOnly(const AssayInfos& ai) const {
      if(e2_){
	return false;
      }
      return ai.isDNaseOnly(e1_->expID_);
    }

    RankDNase getDNaseOnlyRank(const std::string& mpName) const {
      RankDNase r;
      r.accession_ = e1_->expID_;
      r.bigwig_ = e1_->fileID_;
      const SignalLine& s = lines_.at(mpName);
      r.rank_ = s.rank;
      r.signal_ = s.avgSignal;
      r.zscore_ = s.zscore;
      return r;
    }
  };

  class MousePaths {
  public:
    const std::string genome_;
    const std::string chr_;
    const bfs::path base_ = "/home/purcarom/0_metadata/encyclopedia/Version-4/ver8/mm10/raw";
    bfs::path path_;

    MousePaths(const std::string chr)
      : genome_("mm10")
      , chr_("chr" + chr)
    {
      path_ = base_ / chr_;
    }

    bfs::path allGenes(){ return path_ / (chr_ + "_AllGenes"); }
    bfs::path pcGenes(){ return path_ / (chr_ + "_PCGenes"); }
    bfs::path peaks(){ return path_ / (chr_ + "_sorted-peaks"); }
    bfs::path signalDir(){ return path_ / "signal"; }

    bfs::path listFile(const std::string name){ 
      return base_ / (name + "-List.txt");
    }   
  };

  template <typename T>
  class GetData {
    T paths_;

  public:
    GetData(T paths)
      : paths_(paths)
    {}

    // chrY    808996  809318  MP-2173311-100.000000   EE0756098
    Peaks peaks(){
      auto lines = bib::files::readStrings(paths_.peaks());
      std::cout << "loading peaks " << paths_.peaks() << std::endl;
      
      Peaks ret;
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

    // 0    1      2      3                   4    5      6      7                     8 9 10
    // chrY,141692,141850,MP-2173235-3.088310,chrY,206151,207788,ENSMUSG00000101796.1 ,.,+,64302
    MpNameToGenes allGenes(){
      return loadGenes(paths_.allGenes(), "all");
    }

    MpNameToGenes pcGenes(){
      return loadGenes(paths_.pcGenes(), "pc");
    }

    MpNameToGenes loadGenes(bfs::path fnp, std::string typ){
      auto lines = bib::files::readStrings(fnp);
      std::cout << "loading " << typ << " genes " << fnp << std::endl;

      uint32_t count{0};
      MpNameToGenes ret;
      for(const auto& g : lines){
	auto toks = bib::str::split(g, '\t');
	std::string ensembl = toks[7];
	bib::string::rtrim(ensembl);
	// TODO: translate Ensembl ID to gene alias....
	ret[toks[3]].emplace_back(Gene{ensembl,
	      std::stoi(toks[10])});
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
	const std::string fnp = fnps[i].string();
	//std::cout << fnp << std::endl;
	
	const auto lines = bib::files::readStrings(fnp);
	SignalFile sf(fnp);

	for(const auto& g : lines){
	  auto toks = bib::str::split(g, '\t');
	  sf.setSignalLine(toks);
	}
	ret[i] = std::move(sf);
      }

      std::cout << "loaded " << ret.size() << " signal files"
		<< std::endl;
      return ret;
    }

    AssayInfos assayInfos(){
      std::cout << "loading ENCODE exp infos...\n";
      return AssayInfos(paths_);
    }
  };

  class DataHelper {
    MpNameToGenes allGenes_;
    MpNameToGenes pcGenes_;
    std::vector<SignalFile> signalFiles_;
    AssayInfos assayInfos_;
    Peaks peaks_; // map of peaks by accession
    std::vector<std::string> accessions_;

    void setAccessions() {
      accessions_.reserve(peaks_.size());
      for(auto& kv : peaks_){
	accessions_.push_back(kv.first);
      }
      zi::sort(accessions_.begin(), accessions_.end());
    }

  public:
    template <typename T>
    DataHelper(T& paths){
      GetData<T> gd(paths);
      assayInfos_ = gd.assayInfos();
      allGenes_ = gd.allGenes();
      pcGenes_ = gd.pcGenes();
      signalFiles_ = gd.loadSignals();
      peaks_ = gd.peaks();

      setAccessions();
    }

    Peaks& peaks(){ return peaks_; }

    const auto& accessions() const { return accessions_; }

    template <typename T>
    void setAllGenes(const std::string& mpName, T& field) const {
      if(bib::in(mpName, allGenes_)){
	//std::cout << mpName << " all\n";
	field = allGenes_.at(mpName);
	std::sort(field.begin(), field.end());
      } else {
	std::cerr << "no all gene found for " << mpName << "\n";
      }
    }
    
    template <typename T>
    void setPcGenes(const std::string& mpName, T& field) const {
      if(bib::in(mpName, pcGenes_)){
	//std::cout << mpName << " pc\n";
	field = pcGenes_.at(mpName);
	std::sort(field.begin(), field.end());
      } else {
	std::cerr << "no pc gene found for " << mpName << "\n";
      }
    }

    void setDNaseRanks(Peak& p, const std::string& mpName) const {
      for(const auto& sf : signalFiles_){
	if(!sf.isDNaseOnly(assayInfos_)){
	  continue;
	}
	auto rd = sf.getDNaseOnlyRank(mpName);
	const auto& ct = assayInfos_.cellType(rd);
	p.ranksDNase_[ct] = std::move(rd);	
      }
    }

  };

} // namspace bib
