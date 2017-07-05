#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <cstdio>
#include <unordered_map>
#include <functional>

#include <boost/functional/hash.hpp>
#include <boost/filesystem.hpp>

#include "lambda.hpp"
#include "utils.hpp"
#include "region.hpp"
#include "zscore.hpp"
#include "rDHS.hpp"

namespace SCREEN {

  rDHS::rDHS() {}

  /**
      clusters DHSs to make rDHS "master peaks"
      @param input: input vector of regions
      @param ret: vector to receive master peaks
   */
  /* void rDHS_cluster(const std::vector<Region>& input, std::vector<Region>& ret) {
    if (1 == input.size()) {
      ret.push_back(input[0]);
    }
    if(input.size() <= 1) {
      return;
    }
    Region pmp = input[0]; // potential master peak
    std::vector<Region> current, next;
    for (auto i = 0; i < input.size(); ++i) {
      const Region& r = input[i];
      if (r.start < pmp.end) {
	if (r.score > pmp.score) {
	  pmp = r;
	}
	current.push_back(r);
      }
      if (r.start >= pmp.end || i == input.size() - 1) {
	ret.push_back(pmp);
	for (const Region& c : current) {
	  if (c.end <= pmp.start) {
	    next.push_back(c);
	  }
	}
	rDHS_cluster(next, ret);
	next.clear();
	current.clear();
	if (r.start >= pmp.end && i == input.size() - 1) {
	  ret.push_back(r);
	} else {
	  current.push_back(r);
	  pmp = r;
	}
      }
    }
  }

  /**
     clusters the regions contained in the object to produce "master peaks"
     @returns: new RegionSet instance containing the master peaks, sorted
  */
  /*
  RegionSet RegionSet::rDHS_Cluster() {
    sort();
    
    ChrToRegions ret;
    int32_t total = 0;
    int32_t ktotal = 0;
    for (const auto& k : regions_) {
      rDHS_cluster(k.second, ret[k.first]);
      total += ret[k.first].size();
      ktotal += k.second.size();
    }
    std::cout << "total: " << ktotal << " in, " << total << " out\n";
    
    return RegionSet(ret);
  } */

  rDHS::rDHS(const std::vector<bfs::path>& zfile_list) {
    std::cout << "loading regions from " << zfile_list.size() << " files...\n";
    RegionSet r;
    for (const auto& fnp : zfile_list) {
      // r.appendZ(fnp);
    }
    _process(r);
  }

  void rDHS::_process(RegionSet& r) {
    // regions = r.rDHS_Cluster();
    regions.sort();
  }

  void rDHS::write(const std::string& path) {
    size_t acc = 0;
    std::ofstream o(path);
    for (const auto& k : regions.regions()) {
      for (const Region& r : k.second) {
	o << k.first << "\t" << r.start << "\t" << r.end << "\t"
	  << accession(acc++, 'D') << "\n";
      }
    }
  }
  
  void rDHS::write(const boost::filesystem::path& path) {
    write(path.string());
  }

  size_t rDHS::total() {
    return regions.total();
  }

  void rDHS::expandPeaks(size_t halfwidth, ChrLengths &chromInfo) {
    regions.expandPeaks(halfwidth, chromInfo);
  }

  void rDHS::expandPeaks(size_t halfwidth) {
    regions.expandPeaks(halfwidth);
  }

  std::vector<std::vector<std::string>> rDHS::regionlist() {
    std::vector<std::vector<std::string>> ret;
    for (const auto& k : regions.regions()) {
      for (const Region& r : k.second) {
	ret.push_back({ k.first,
	      std::to_string(r.start),
	      std::to_string(r.end) });
      }
    }
    return ret;
  }
  
} // namespace SCREEN
