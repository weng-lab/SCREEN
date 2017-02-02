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

  class MasterPeaks : public std::unordered_map<std::string, MasterPeak>
  {
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

    bfs::path allGenes(){ return path_ / "AllGenes.bed"; }
    bfs::path pcGenes(){ return path_ / "PCGenes.bed"; }
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

  class GetData {
    const HumanMousePaths& paths_;

    std::unordered_map<std::string, uint32_t> geneNameToID_;

  public:
    GetData(const HumanMousePaths& paths)
      : paths_(paths)
    {}

    // chrY    808996  809318  MP-2173311-100.000000   EE0756098
    MasterPeaks peaks(){
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
  };
  
} // namespace bib
