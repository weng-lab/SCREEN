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

  inline std::vector<std::string> readGzStrings(bfs::path fnp){
    uint32_t N = 65536;
    char buffer[N];
    GZSTREAM::igzstream in(buffer);
    in.open(fnp.string());

    std::vector<std::string> ret;
    std::string str;
    while(std::getline(in, str)){
      ret.push_back(str);
    }
    in.close();
    return ret;
  }

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

  struct RankSimple {
    std::string accession_;
    std::string bigwig_;
    float signal_;
    float zscore_;
    bool only_ = true;

    friend auto& operator<<(std::ostream& s, const RankSimple& r){
      s << r.accession_ << " " << r.bigwig_ << " ";
      if(r.only_){
	s << "signal: " << r.signal_;
      } else {
	s << "zscore: " << r.zscore_;
      }
      return s;
    }
  };

  struct RankMulti {
    std::unordered_map<std::string, RankSimple> parts_;
    uint32_t rank_;
    float zscore_;

    friend auto& operator<<(std::ostream& s, const RankMulti& rm){
      s << rm.rank_ << " " << rm.zscore_ << "\n";
      for(const auto& kv : rm.parts_){
	s << "\t\t\t\t" << kv.first << " " << kv.second << "\n";
      }
      return s;
    }
  };

  class RankContainer {
    std::unordered_map<std::string, RankMulti> rankTypeToRank_;

  public:
    void add(std::string rankType, RankMulti& rm){
      rankTypeToRank_[rankType] = rm;
    }

    friend auto& operator<<(std::ostream& s, const RankContainer& rm){
      for(const auto& kv : rm.rankTypeToRank_){
	s << "\t\t\t" << kv.first << "\t" << kv.second << "\n";
      }
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
    std::map<std::string, RankDNase> ranksDNase_;

    // celltype to multi-ranks
    std::unordered_map<std::string, RankContainer> ranksCTCF_;
    std::unordered_map<std::string, RankContainer> ranksEnhancer_;

    friend auto& operator<<(std::ostream& s, const Peak& p){
      s << p.accession << "\n";
      s << "\t" << p.mpName << "\n";
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

      s << "\tRanks: CTCF:\n";
      for(const auto& kv: p.ranksCTCF_){
	s << "\t\t" << kv.first << "\n" << kv.second;
      }

      s << "\tRanks: Enhancer:\n";
      for(const auto& kv: p.ranksEnhancer_){
	s << "\t\t" << kv.first << "\n" << kv.second;
      }
      return s;
    }
  };

  using MpNameToGenes = std::unordered_map<std::string, std::vector<Gene>>;

  using Peaks = std::unordered_map<std::string, Peak>;

  struct SignalLine {
    uint32_t rank;
    float signal;
    float zscore;

    float avg_zscore;
    float left_zscore;
    float right_zscore;
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

    bool is(const std::string& assay,
	    const std::string& expID) const {
      return bib::in(expID, infos_.at(assay).expIDtoMeta_);
    }
    
    bool isDNase(const std::string& expID) const {
      return bib::in(expID, infos_.at("DNase").expIDtoMeta_);
    }

    bool isCTCF(const std::string& expID) const {
      return bib::in(expID, infos_.at("CTCF").expIDtoMeta_);
    }

    bool isH3K27ac(const std::string& expID) const {
      return bib::in(expID, infos_.at("H3K27ac").expIDtoMeta_);
    }

    const std::string& cellType(std::string assay, std::string expID) const {
      return infos_.at(assay).expIDtoMeta_.at(expID).cellType_;
    }

    const std::string& cellType(const RankDNase& rd) const {
      return cellType("DNase", rd.accession_);
    }

    const std::string& cellType(const std::string assay,
                                const RankSimple& rs) const {
      return cellType(assay, rs.accession_);
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

    void reserve(size_t s){
      lines_.reserve(s);
    }
    
    void setSignalLine(const auto& toks){
      if(4 == toks.size()){
	// MP-2175312-100.000000  -0.08  0.95  635383
	// mpName                 zscore signal rank
	SignalLine s;
	s.zscore = std::stof(toks[1]);
	s.signal = std::stof(toks[2]);
	s.rank = std::stoi(toks[3]);
	lines_[toks[0]] = std::move(s);

      } else if(5 == toks.size()){
	// MP-2175312-100.000000  -0.70  1060099  -0.08  -1.33
	// mpName                 avgZ   rank     leftZ  rightZ
	SignalLine s;
	s.avg_zscore = std::stof(toks[1]);
	s.rank = std::stoi(toks[2]);
	s.left_zscore = std::stof(toks[3]);
	s.right_zscore = std::stof(toks[4]);
	lines_[toks[0]] = std::move(s);

      } else {
	throw std::runtime_error("invalid num toks");
      }
    }

    bool hasMpName(const std::string& mpName) const {
      return bib::in(mpName, lines_);
    }

    bool isOnly(const AssayInfos& ai, const std::string& assay) const {
      if(e2_){
	return false;
      }
      if(!e1_){
	return false;
      }
      return ai.is(assay, e1_->expID_);
    }

    bool isDNaseOnly(const AssayInfos& ai) const {
      if(e2_){
	return false;
      }
      if(!e1_){
	return false;
      }
      return ai.isDNase(e1_->expID_);
    }


    bool isCTCFonly(const AssayInfos& ai) const {
      if(e2_){
	return false;
      }
      if(!e1_){
	return false;
      }
      return ai.isCTCF(e1_->expID_);
    }

    bool isH3K27acOnly(const AssayInfos& ai) const {
      if(e2_){
	return false;
      }
      if(!e1_){
	return false;
      }
      return ai.isH3K27ac(e1_->expID_);
    }

    bool isAnd(const AssayInfos& ai, const std::string& assay1,
	       const std::string& assay2) const {
      if(!e2_){
	return false;
      }
      if(!e1_){
	return false;
      }
      return ai.is(assay1, e1_->expID_) && ai.is(assay2, e2_->expID_) || ai.is(assay2, e1_->expID_) && ai.is(assay1, e2_->expID_);
    }

    bool isDNaseAndCTCF(const AssayInfos& ai) const {
      if(!e2_){
	return false;
      }
      if(!e1_){
	return false;
      }
      return ai.isDNase(e1_->expID_) && ai.isCTCF(e2_->expID_);
    }

    bool isDNaseAndH3K27ac(const AssayInfos& ai) const {
      if(!e2_){
	return false;
      }
      if(!e1_){
	return false;
      }
      return ai.isDNase(e1_->expID_) && ai.isH3K27ac(e2_->expID_);
    }

    RankDNase getDNaseOnlyRank(const std::string& mpName) const {
      RankDNase r;
      r.accession_ = e1_->expID_;
      r.bigwig_ = e1_->fileID_;
      const SignalLine& s = lines_.at(mpName);
      r.rank_ = s.rank;
      r.signal_ = s.signal;
      r.zscore_ = s.zscore;
      return r;
    }

    RankMulti getSingleAssayRank(const std::string typ,
                                 const std::string& mpName) const {
      RankMulti rm;

      RankSimple r;
      r.accession_ = e1_->expID_;
      r.bigwig_ = e1_->fileID_;
      const SignalLine& s = lines_.at(mpName);
      r.signal_ = s.signal;

      rm.parts_[typ] = r;
      rm.rank_ = s.rank;
      rm.zscore_ = s.zscore;
      return rm;
    }

    RankMulti getDoubleAssayRank(const std::string typ1,
                                 const std::string typ2,
                                 const std::string& mpName) const {
      const SignalLine& s = lines_.at(mpName);

      RankSimple r1;
      r1.accession_ = e1_->expID_;
      r1.bigwig_ = e1_->fileID_;
      r1.only_ = false;
      r1.zscore_ = s.left_zscore;

      RankSimple r2;
      r2.accession_ = e2_->expID_;
      r2.bigwig_ = e2_->fileID_;
      r2.only_ = false;
      r2.zscore_ = s.right_zscore;

      RankMulti rm;
      rm.parts_[typ1] = r1;
      rm.parts_[typ2] = r2;
      rm.rank_ = s.rank;
      rm.zscore_ = s.avg_zscore;
      return rm;
    }
  };

  class MousePaths {
  public:
    const std::string genome_;
    const std::string chr_;
    const bfs::path base_ = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver8/mm10/raw";
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
    bfs::path signalDir(){
      return path_ / "signal";
      return base_ / "signal-output-orig";
    }

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
      ret.reserve(lines.size());
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

    std::vector<SignalFile> loadSignals(const AssayInfos& ai){
      auto dir = bib::files::dir(paths_.signalDir());
      const std::vector<bfs::path> fnps(dir.begin(), dir.end());

      std::cout << "found " << fnps.size() << " signal files"
		<< std::endl;

      std::vector<SignalFile> ret(fnps.size());

#pragma omp parallel for
      for(size_t i = 0; i < fnps.size(); ++i){
	const std::string fn = fnps[i].filename().string();
	const std::string fnp = fnps[i].string();

	const auto lines = bib::files::readStrings(fnp); // readGzStrings(fnp);
	SignalFile sf(fnp);
	sf.reserve(lines.size());
	std::cout << i << "\t" << fnp << " " << sf.isDNaseOnly(ai)
		  << " " << sf.isCTCFonly(ai)
		  << " " << sf.isDNaseAndCTCF(ai)
		  << std::endl;

	if(bib::str::startswith(fn, "mm10.60way.")){
	  continue;
	}

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
      signalFiles_ = gd.loadSignals(assayInfos_);
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

    void setDNaseRanks(Peak& p) const {
      const std::string& mpName = p.mpName;
      for(const auto& sf : signalFiles_){
	if(!sf.isDNaseOnly(assayInfos_)){
	  continue;
	}
	auto rd = sf.getDNaseOnlyRank(mpName);
	const auto& ct = assayInfos_.cellType(rd);
	p.ranksDNase_[ct] = std::move(rd);
      }
    }

    struct OnlyAssayRank {
      std::string assay; // CTCF
      std::string outputKey; // ctcf
      std::string outputTitle; // CTCF-only
    };

    struct MultiAssayRank {
      std::string assay1; // DNase
      std::string assay2; // CTCF
      std::string outputKey1; // dnase
      std::string outputKey2; // ctcf
      std::string outputTitle; // DNase+CTCF
    };

    template <typename T>
    void setRanks(const std::string& mpName,
		  T& ranks, const OnlyAssayRank& only,
		  const MultiAssayRank& m) const {
      for(const auto& sf : signalFiles_){
	if(!sf.isOnly(assayInfos_, only.assay)){
	  continue;
	}
	if(!sf.hasMpName(mpName)){
	  //std::cout << "\tskipping " << mpName << std::endl;
	  continue;
	}
	auto rm = sf.getSingleAssayRank(only.outputKey, mpName);
	const auto& ct = assayInfos_.cellType(only.assay,
					      rm.parts_[only.outputKey]);
	ranks[ct].add(only.outputTitle, rm);
      }
    
      for(const auto& sf : signalFiles_){
	if(!sf.isAnd(assayInfos_, m.assay1, m.assay2)){
	  continue;
	}
	if(!sf.hasMpName(mpName)){
	  //std::cout << "\tskipping " << mpName << std::endl;
	  continue;
	}
	auto rm = sf.getDoubleAssayRank(m.outputKey1,
					m.outputKey2, mpName);
	const auto& ct = assayInfos_.cellType(m.assay1,
					      rm.parts_[m.outputKey1]);
	ranks[ct].add(m.outputTitle, rm);
      }
    }

    void setCTCFRanks(Peak& p) const {
      OnlyAssayRank only{"CTCF", "ctcf", "CTCF-only"};
      MultiAssayRank m{"DNase", "CTCF", "dnase", "ctcf", "DNase+CTCF"};
      setRanks(p.mpName, p.ranksCTCF_, only, m);
    }

    void setEnhancerRanks(Peak& p) const {
      OnlyAssayRank only{"H3K27ac", "h3k27ac", "H3K27ac-only"};
      MultiAssayRank m{"DNase", "H3K27ac", "dnase", "h3k27ac", "DNase+H3K27ac"};
      setRanks(p.mpName, p.ranksEnhancer_, only, m);
    }

  };

} // namspace bib
