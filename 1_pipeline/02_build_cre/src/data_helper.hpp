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
#include "paths.hpp"
#include "signal_files.hpp"
#include "mpname.hpp"
#include "ranks.hpp"
#include "peak.hpp"
#include "peaks.hpp"
#include "get_data.hpp"

namespace bib {

  namespace bfs = boost::filesystem;

  class DataHelper {
    Peaks& peaks_;

    MpNameToGenes tads_;
    MpNameToGenes allGenes_;
    MpNameToGenes pcGenes_;

      std::vector<SignalFile> signalFilesConservation_;
      std::vector<SignalFile> signalFilesDnaseOnly_;
      std::vector<SignalFile> signalFilesCtcfOnly_;
      std::vector<SignalFile> signalFilesCtcfDnase_;
      std::vector<SignalFile> signalFilesH3k27acOnly_;
      std::vector<SignalFile> signalFilesH3k27acDnase_;
      std::vector<SignalFile> signalFilesH3k4me3Only_;
      std::vector<SignalFile> signalFilesH3k4me3Dnase_;

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

      int dnaseCols = 4;
      if("mm10" == ZiARG_assembly){
          dnaseCols = 3;
      }

      gd.loadSignals(paths.base_ / "CTCF-List.txt",
                     signalFilesCtcfOnly_, 3, ONLY);
      gd.loadSignals(paths.base_ / "DNase-List.txt",
                     signalFilesDnaseOnly_, dnaseCols, ONLY);
      gd.loadSignals(paths.base_ / "Enhancer-List.txt",
                     signalFilesH3k27acDnase_, 5, RANKZSCORE);
      gd.loadSignals(paths.base_ / "H3K27ac-List.txt",
                     signalFilesH3k27acOnly_, 3, ONLY);
      gd.loadSignals(paths.base_ / "H3K4me3-List.txt",
                     signalFilesH3k4me3Only_, 3, ONLY);
      gd.loadSignals(paths.base_ / "Insulator-List.txt",
                     signalFilesCtcfDnase_,6, RANKZSCORE);
      gd.loadSignals(paths.base_ / "Promoter-List.txt",
                     signalFilesH3k4me3Dnase_,5, RANKZSCORE);

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
