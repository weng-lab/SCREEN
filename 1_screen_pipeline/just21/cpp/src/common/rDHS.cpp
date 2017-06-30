#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <cstdio>
#include <unordered_map>

#include <boost/functional/hash.hpp>
#include <boost/filesystem.hpp>

#include "utils.hpp"
#include "region.hpp"
#include "zscore.hpp"
#include "rDHS.hpp"

namespace SCREEN {

  rDHS::rDHS(const std::vector<bfs::path>& zfile_list) {
    std::cout << "loading regions from " << zfile_list.size() << " files...\n";
    RegionSet r;
    for (const auto& fnp : zfile_list) {
      r.appendZ(fnp);
    }
    _process(r);
  }

  void rDHS::_process(RegionSet& r) {
    regions = r.rDHS_Cluster();
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
