//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#include <vector>
#include <unordered_map>
#include <string>

#include <boost/filesystem.hpp>

#include "cpp/string_utils.hpp"
#include "cpp/files.hpp"

#include "common/utils.hpp"
#include "common/lambda.hpp"
#include "common/region.hpp"
#include "common/zscore.hpp"
#include "common/rDHS.hpp"
#include "common/binarysignal.hpp"
#include "common/saturation.hpp"
#include "common/correlation.hpp"
#include "paths.hpp"
#include "cREs/ctcf_tad.hpp"
#include "lookup_matrix.hpp"
#include "cistrome.hpp"

namespace SCREEN {

  Cistrome::Cistrome(const bfs::path &root, const bfs::path &output_root, const std::string &assembly) : root_(output_root / assembly), assembly_(assembly) {
    std::string species = (assembly.compare("hg38") == 0 ? "human" : "mouse");
    for (auto &file : list_files(root / ("dnase_" + species))) {
      dnase_files_.push_back(file);
    }
  }

  /**
     compute Z-scores for all the raw DHSs
     results are saved to the Z-score output directory defined in the Paths class
   */
  void Cistrome::computeZScores(bool force_recompute) {

#pragma omp parallel for
    for (auto i = 0; i < dnase_files_.size(); ++i) {
      
      bfs::path output_path = root_ / "DHS" / "Cistrome" / basename(dnase_files_[i]);
      std::string acc = basename(output_path);
      if (force_recompute || !bfs::exists(output_path)) {

	// get DHS signal and compute Z-scores
	ScoredRegionSet ZScores;
	RegionFilter qfilter = QFilter(DHS_FDR_THRESHOLD);
	ZScores.appendNarrowPeak(dnase_files_[i], qfilter);
	if (ZScores.regions_.total() <= 3) { continue; }
	ZScores.convertToZ();

	// write regions with unique IDs
	int n = 0;
	std::ofstream f(output_path.string());
	for (auto &kv : ZScores.regions_.regions_) {
	  for (auto &region : kv.second) {
	    f << kv.first << '\t' << region.start << '\t' << region.end << '\t'
	      << acc << '_' << (n++) << '\t' << region.score << '\n';
	  }
	}
	std::cout << basename(output_path) << "\t" << ZScores.regions_.total() << "\n";

      }

    }

  }

  /**
     computes rDHSs; requires Z-score output from ENCODE::computeZScores
     saves results to the rDHS path defined in the Paths class
   */
  void Cistrome::make_rDHS(bool force_recompute) {
    
    bfs::path output = root_ / "rDHS.cistrome.bed";
    if (bfs::exists(output) && !force_recompute) {
      load_rDHS();
      return;
    }

    // get paths to Z-score output
    std::vector<bfs::path> zpaths;
    for (auto i = 0; i < dnase_files_.size(); ++i) {
      bfs::path path = root_ / "DHS" / "Cistrome" / basename(dnase_files_[i]);
      if (bfs::exists(path)) { zpaths.push_back(path); }
    }

    // compute rDHSs and write
    rDHS_ = rDHS(zpaths);
    rDHS_.write(output);
    std::cout << "wrote " << rDHS_.regions_.regions_.total() << " rDHSs to " << output << "\n";

  }

  /**
     loads rDHSs from disk; must be saved to rDHS_list path from the paths object
   */
  void Cistrome::load_rDHS() {
    rDHS_ = rDHS(root_ / "rDHS.cistrome.bed");
  }

  /**
     creates saturation curve; requires output from ENCODE::computeZScores
     output is saved to the saturation path defined in the Paths class
   */
  void Cistrome::make_saturation() {

    /*      
    // load regions
    std::vector<ScoredRegionSet> r(idx.size());
#pragma omp parallel for
    for (auto i = 0; i < idx.size(); ++i) {
      r[i].appendZ(path_.DHS_ZScore(idx[i]));
    }

    // run saturation
    Saturation s(r, celltypemap);
    s.write(path_.saturation());
    std::cout << "wrote " << path_.saturation() << '\n';
    */

  }

} // SCREEN
