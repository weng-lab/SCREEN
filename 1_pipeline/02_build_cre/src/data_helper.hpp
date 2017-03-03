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

#include "rdhs.hpp"
#include "paths.hpp"
#include "signal_files.hpp"
#include "peak.hpp"
#include "peaks.hpp"
#include "get_data.hpp"

namespace bib {

  namespace bfs = boost::filesystem;

  class DataHelper {
    Peaks& peaks_;

    AccessionToGenes tads_;
    AccessionToGenes allGenes_;
    AccessionToGenes pcGenes_;

  public:
    std::vector<SignalFile> conservation_files_;
    std::vector<SignalFile> ctcf_files_;
    std::vector<SignalFile> dnase_files_;
    std::vector<SignalFile> enhancer_files_;
    std::vector<SignalFile> h3k27ac_files_;
    std::vector<SignalFile> h3k4me3_files_;
    std::vector<SignalFile> insulator_files_;
    std::vector<SignalFile> promoter_files_;

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

      gd.loadSignals(paths.raw_ / "conservation-list.txt",
                     conservation_files_, 1);
      gd.loadSignals(paths.raw_ / "ctcf-list.txt",
                     ctcf_files_, 3);
      gd.loadSignals(paths.raw_ / "dnase-list.txt",
                     dnase_files_, 3);
      gd.loadSignals(paths.raw_ / "enhancer-list.txt",
                     enhancer_files_, 5);
      gd.loadSignals(paths.raw_ / "h3k27ac-list.txt",
                     h3k27ac_files_, 3);
      gd.loadSignals(paths.raw_ / "h3k4me3-list.txt",
                     h3k4me3_files_, 3);
      gd.loadSignals(paths.raw_ / "insulator-list.txt",
                     insulator_files_, 5);
      gd.loadSignals(paths.raw_ / "promoter-list.txt",
                     promoter_files_, 5);

      peaks_ = gd.peaks();
      peaks_.setAccessions();
    }

    template <typename T>
    void setTads(const std::string& mpName, T& p) const {
        if(bib::in(mpName, tads_)){
            p.tads = tads_.at(mpName);
        }
    }

    template <typename T>
    void setConservation(const std::string& mpName, T& p) const {
    }

    template <typename T>
    void setAllGenes(const std::string& mpName, T& p) const {
        p.gene_nearest_all = allGenes_.at(mpName);
    }

    template <typename T>
    void setPcGenes(const std::string& mpName, T& p) const {
        p.gene_nearest_pc = pcGenes_.at(mpName);
    }

    template <typename V, typename F>
    void set(const std::string& rDHS, V& v, const F& files) const {
      for(const auto& sf : files){
	if(bib::in(rDHS, sf.lines_)){
	  v.push_back(sf.lines_.at(rDHS));
	}
      }
    }
  };

} // namespace bib
