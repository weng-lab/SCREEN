//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#include <vector>
#include <string>
#include <unordered_map>
#include <fstream>
#include <sstream>
#include <iterator>

#include <armadillo>

#include <boost/filesystem.hpp>

#include "common/utils.hpp"
#include "common/lambda.hpp"
#include "common/region.hpp"
#include "common/rDHS.hpp"
#include "common/binarysignal.hpp"
#include "paths.hpp"
#include "lookup_matrix.hpp"

namespace SCREEN {

  bool LookupMatrix::biosample_has(const std::string &biosample, const std::string &assay) {
    return 0 != matrix_[biosample][assay].compare("NA");
  }

  bool LookupMatrix::biosample_has_all(const std::string &biosample) {
    return biosample_has(biosample, "DNase") && biosample_has(biosample, "H3K4me3")
      && biosample_has(biosample, "H3K27ac") && biosample_has(biosample, "CTCF");
  }
  
  LookupMatrix::LookupMatrix(const std::string &path) {

    std::ifstream input(path);

    // for each line in file...
    for (std::string row; std::getline(input, row, '\n');) {
      // key is first col; create map
      std::vector<std::string> cols(split(row, '\t'));
      matrix_[cols[0]] = matrix_entry({
	  {"name", cols[1]},
	  {"DNase", cols[2]},
	  {"H3K4me3", cols[3]},
	  {"H3K27ac", cols[4]},
	  {"CTCF", cols[5]}
      });
    }

    // get lists by assay
    for (auto &e : matrix_){
      if (biosample_has_all(e.first)) { AllFour_.push_back(e.second); }
      if (biosample_has(e.first, "DNase")) { AllDNase_.push_back(e.second); }
      if (biosample_has(e.first, "H3K4me3")) { AllH3K4me3_.push_back(e.second); }
      if (biosample_has(e.first, "H3K27ac")) { AllH3K27ac_.push_back(e.second); }
      if (biosample_has(e.first, "CTCF")) { AllCTCF_.push_back(e.second); }
    }
  }

  void LookupMatrix::binarize(Paths &path, RegionSet &r) {
    const boost::filesystem::path root = path.root() / "rDHS";
    BinarySignal dc(root / "signal");
    BinarySignal h(root / "signal+500"); 
    for (const auto &kv : matrix_) {
      const auto &exp = kv.first;
      for (const auto &entry : kv.second) {
	if (0 != entry.second.compare("NA")) {
	  if ((0 == entry.first.compare("DNase") || 0 == entry.first.compare("CTCF"))
	      && !boost::filesystem::exists(root / "signal" / entry.second)) {
	    dc.convertSignal(path.EncodeData(kv.first, entry.second, ".bigWig"));
	  } else if (!boost::filesystem::exists(root / "signal+500" / entry.second)) {
	    h.convertSignal(path.EncodeData(kv.first, entry.second, ".bigWig"));
	  }
	}
      }
    }
  }

  matrix_entry &LookupMatrix::operator [](const std::string &index) {
    return matrix_[index];
  }
  
} // SCREEN
