#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <cstdio>
#include <unordered_map>

#include <boost/functional/hash.hpp>
#include <boost/filesystem.hpp>

#include "utils.hpp"
#include "common/region.hpp"
#include "zscore.hpp"
#include "rDHS.hpp"

namespace SCREEN {
  
  void rDHS::_process(RegionSet &r) {
    regions = r.rDHS_Cluster();
    regions.sort();
  }

  void rDHS::write(const std::string &path) {
    size_t acc = 0;
    std::ofstream o(path);
    for (auto k : regions.regions()) {
      for (region : k.second) {
	o << k.first << "\t" << region.start << "\t" << region.end << "\t" << accession(acc++, 'D') << "\n";
      }
    }
  }
  
  void rDHS::write(const boost::filesystem::path &path) {
    write(path.string());
  }

  size_t rDHS::total() {
    return regions.total();
  }

  std::vector<std::vector<std::string>> rDHS::regionlist() {
    std::vector<std::vector<std::string>> retval;
    for (auto k : regions.regions()) {
      for (struct region r : k.second) {
	retval.push_back({ k.first, std::to_string(r.start), std::to_string(r.end) });
      }
    }
    return retval;
  }
  
  rDHS::rDHS(const std::vector<std::string> &zfile_list) {
    std::cout << "loading regions from " << zfile_list.size() << " files...\n";
    RegionSet r;
    for (std::string file : zfile_list) {
      r.appendZ(file);
    }
    _process(r);
  }
  
}
