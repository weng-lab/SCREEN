#include <vector>
#include <iostream>
#include <algorithm>
#include <iterator>
#include <unordered_map>

#include <boost/filesystem.hpp>
#include <boost/filesystem/path.hpp>

#include "common/region.hpp"
#include "zscore.hpp"
#include "saturation.hpp"
#include "rDHS.hpp"

namespace SCREEN {

  std::vector<int> xrange(int lim) {
    std::vector<int> retval(lim);
    for (auto i = 0; i < lim; ++i) { retval[i] = i; }
    return retval;
  }

  Saturation::Saturation(const std::vector<RegionSet> &regionsets, int n_repeat) {
    for (auto i = 10; i < regionsets.size(); i += 10) {
      std::cout << "Saturation::Saturation: taking first " << i << " exps\n";
      std::vector<size_t> results(n_repeat);

#pragma omp parallel for
      for (auto n = 0; n < n_repeat; ++n) {
	std::vector<int> idx = xrange(regionsets.size());
	std::random_shuffle(idx.begin(), idx.end());
	RegionSet r;
	for (auto j = 0; j < i; ++j) {
	  r.appendRegionSet(regionsets[idx[j]]);
	}
	results[n] = r.rDHS_Cluster().total();
      }

      n_rDHSs.push_back(results);

    }
  }

  void Saturation::write(const boost::filesystem::path &outpath) const {
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
