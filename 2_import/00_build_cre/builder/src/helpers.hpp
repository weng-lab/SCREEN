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
#include <zi/concurrency/concurrency.hpp>
#include <zi/system.hpp>

#include "cpp/utility.hpp"
#include "cpp/string_utils.hpp"
#include "cpp/files.hpp"
#include "cpp/gzip_reader.hpp"
#include "cpp/tictoc.hpp"
#include "cpp/gzstream.hpp"

namespace bib {

  namespace bfs = boost::filesystem;

  struct Gene {
    std::string name;
    uint32_t distance;

    friend bool operator<(const Gene& a, const Gene& b){
      return std::tie(a.distance, a.name) <
	std::tie(b.distance, b.name);
    }

    friend std::ostream& operator<<(std::ostream& s, const Gene& g){
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

    friend std::ostream& operator<<(std::ostream& s, const Peak& p){
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

  struct SignalFile {
    bfs::path fnp;
    std::string leftExps;
    std::string rightExps;
    std::unordered_map<std::string, SignalLine> lines;
  };

  class MousePaths {
  public:
    const std::string genome_;
    const std::string chr_;
    const bfs::path base_ = "/home/purcarom/0_metadata/encyclopedia/Version-4/ver8/mm10/raw";
    bfs::path path_;

    MousePaths(std::string chr)
      : genome_("mm10")
      , chr_("chr" + chr)
    {
      path_ = base_ / chr_;
    }

    bfs::path allGenes(){
      return path_ / (chr_ + "_AllGenes");
    }
    bfs::path pcGenes(){
      return path_ / (chr_ + "_PCGenes");
    }
    bfs::path peaks(){
      return path_ / (chr_ + "_sorted-peaks");
    }
    bfs::path signalDir(){
      return path_ / "signal";
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
	SignalFile sf;
	sf.fnp = fnp;

	if(bib::str::startswith(fnp, "EN")){
	  const auto toks = bib::str::split(fnp, '\t');

	}
	
	for(const auto& g : lines){
	  auto toks = bib::str::split(g, '\t');
	  sf.lines[toks[0]] = SignalLine{std::stof(toks[1]),
					 std::stof(toks[2]),
					 std::stoi(toks[3])};
	}
	ret[i] = std::move(sf);
      }

      std::cout << "loaded " << ret.size() << " signal files"
		<< std::endl;
      return ret;
    }
  };

} // namspace bib
