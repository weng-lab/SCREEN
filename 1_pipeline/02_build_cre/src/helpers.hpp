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

#include "mpname.hpp"
#include "signal_files.hpp"
#include "mpname.hpp"
#include "ranks.hpp"
#include "peak.hpp"
#include "peaks.hpp"
#include "get_data.hpp"

namespace bib {

  namespace bfs = boost::filesystem;


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
