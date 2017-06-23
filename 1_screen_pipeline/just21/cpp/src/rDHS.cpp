#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <cstdio>

#include <boost/functional/hash.hpp>

#include "utils.hpp"
#include "zscore.hpp"
#include "rDHS.hpp"

namespace SCREEN {

  /*
   *  clusters the raw DHSs stored in rawlines into rDHSs
   *  output is written to the given path, then read into the passed vector
   */
  void cluster_and_read(const std::vector<std::string> &rawlines, const std::string &path,
			std::vector<std::string> &rDHSs) {

    write(rawlines, path + "us");
    exec("sort-bed " + path + "us > " + path);
    std::string get_final = "bedops -u ";
    std::string tmpm = path + "m_";
    int n = 0;
    while (lines(path) > 0) {
      std::string ipath = path + std::to_string(n);
      std::cout << "rDHS::cluster_and_read: iteration " << n++ << "\n";
      get_final += ipath + " ";
      exec("bedops -m --range 0:-1 " + path + " | bedops -u --range 0:1 - > " + tmpm);
      exec("bedmap --max-element " + tmpm + " " + path + " | sort-bed - > " + ipath);
      exec("bedops -n 1 " + path + " " + ipath + " > " + path + "_");
      std::rename((path + "_").c_str(), path.c_str());
    }

    exec(get_final + "> " + path);
    for (auto i = 0; i < n; ++i) {
      std::remove((path + std::to_string(i)).c_str());
      std::remove(tmpm.c_str());
    }
    read(rDHSs, path);

  }

  rDHS::rDHS(const std::vector<std::string> &narrowPeakList,
	     const std::string &output_path) {
    std::vector<std::string> rawlines;
    for (auto path : narrowPeakList) {
      std::cout << path << "\t" << rawlines.size() << "\n";
      read(rawlines, path);
    }
    rDHSs.clear();
    cluster_and_read(rawlines, output_path, rDHSs);
  }

  const std::string &rDHS::operator [](size_t index) {
    return rDHSs[index];
  }
  
}
