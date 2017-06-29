#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <cstdio>
#include <unordered_map>

#include <boost/functional/hash.hpp>
#include <boost/filesystem.hpp>
#include <boost/filesystem/path.hpp>

#include "utils.hpp"
#include "common/region.hpp"
#include "zscore.hpp"
#include "rDHS.hpp"

namespace SCREEN {

  void rDHS::_process(RegionSet &r) {
    //    std::cout << "found " << r.regions().size() << " DHSs\n";
    RegionSet c = r.rDHS_Cluster();
    c.sort();
    c.write("/data/projects/cREs/hg19/rDHS.bed");
    std::cout << "/data/projects/cREs/hg19/rDHS.bed" << "\n";
    
    // std::cout << "wrote " << c.regions().size() << " rDHSs to /data/projects/cREs/hg19/rDHS.bed\n";
  }

  rDHS::rDHS(const boost::filesystem::path &binary_path) {
    //RegionSet r(binary_path);
    //_process(r);
  }

  rDHS::rDHS(const std::vector<std::string> &zfile_list) {

    std::cout << "loading regions from " << zfile_list.size() << " files...\n";
    RegionSet r;
    for (std::string file : zfile_list) {
      r.appendZ(file);
    }
    _process(r);
    //    r.write("/home/pratth/test.dat");
    
  }

  const std::string &rDHS::operator [](size_t index) {
    return rDHSs[index];
  }
  
}
