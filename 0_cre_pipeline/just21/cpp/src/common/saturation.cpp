//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#include <vector>
#include <iostream>
#include <algorithm>
#include <iterator>
#include <unordered_map>

#include <boost/filesystem.hpp>

#include "utils.hpp"
#include "lambda.hpp"
#include "region.hpp"
#include "zscore.hpp"
#include "rDHS.hpp"
#include "saturation.hpp"

namespace SCREEN {

  std::vector<int> xrange(int lim) {
    std::vector<int> retval(lim);
    for (auto i = 0; i < lim; ++i) { retval[i] = i; }
    return retval;
  }

  Saturation::Saturation(const std::vector<ScoredRegionSet> &regionsets, int n_repeat) {
    for (auto i = 10; i < regionsets.size(); i += 10) {
      std::cout << "Saturation::Saturation: taking first " << i << " exps\n";
      std::vector<size_t> results(n_repeat);

#pragma omp parallel for
      for (auto n = 0; n < n_repeat; ++n) {
	std::vector<int> idx = xrange(regionsets.size());
	std::random_shuffle(idx.begin(), idx.end());
	ScoredRegionSet r;
	for (auto j = 0; j < i; ++j) {
	  r.regions_.appendGenericRegionSet(regionsets[idx[j]].regions_);
	}
	results[n] = rDHS(r).regions_.regions_.total();
      }
      n_rDHSs.push_back(results);

    }
  }

  Saturation::Saturation(const std::vector<ScoredRegionSet> &regionsets,
			 std::unordered_map<std::string, std::vector<int>> &celltypemap,
			 int n_repeat) {

    std::vector<std::string> celltypes;
    for (auto &kv : celltypemap) {
      celltypes.push_back(kv.first);
    }

    for (auto i = 10; i < celltypes.size(); i += 10) {
      std::cout << "Saturation::Saturation: taking first " << i << " cell types\n";
      std::vector<size_t> results(n_repeat);

#pragma omp parallel for
      for (auto n = 0; n < n_repeat; ++n) {
	std::vector<int> idx = xrange(celltypes.size());
	std::random_shuffle(idx.begin(), idx.end());
	ScoredRegionSet r;
	for (auto j = 0; j < i; ++j) {
	  for (auto m : celltypemap[celltypes[idx[j]]]) {
	    r.regions_.appendGenericRegionSet(regionsets[m].regions_);
	  }
	}
	results[n] = rDHS(r).regions_.regions_.total();
      }
      n_rDHSs.push_back(results);

    }
  }

  void Saturation::write(const bfs::path &outpath) const {
    std::ofstream o(outpath.string());
    for (auto i = 0; i < n_rDHSs.size(); ++i) {
      o << (i * 10) << "\t" << n_rDHSs[i][0];
      for (auto n = 1; n < n_rDHSs[i].size(); ++n) {
	o << "," << n_rDHSs[i][n];
      }
      o << "\n";
    }
  }

} // SCREEN
