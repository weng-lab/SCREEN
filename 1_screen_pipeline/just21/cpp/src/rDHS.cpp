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
   *  appends the peaks from the given ZScore set to the list of lines in rawlines
   *  nameprefix is appended to the name column to distinguish DHSs from different files
   */
  void genlines(const SCREEN::ZScore &z, const std::string &nameprefix,
		std::vector<std::string> &rawlines) {
    for (auto i = 0; i < z.lines.size(); ++i) {
      std::vector<std::string> cols(split(z.lines[i], '\t'));
      rawlines.push_back(cols[0] + "\t" + cols[1] + "\t" + cols[2] + "\t" + nameprefix + "_" + cols[3] + "\t" +
			 (cols.size() >= 5 ? cols[4] : "0") + "\t" + (cols.size() >= 6 ? cols[5] : ".") + "\t" +
			 std::to_string(z.zscores[i]) + "\t-1\t" + (cols.size() >= 9 ? cols[8] : "-1"));
    }
  }

  /*
   *  clusters the raw DHSs stored in rawlines into rDHSs
   *  output is written to the given path, then read into the passed vector
   */
  void cluster_and_read(const std::vector<std::string> &rawlines, const std::string &path,
			std::vector<std::string> &rDHSs) {
    write(rawlines, path + "us");
    exec("sort-bed " + path + "us > " + path);
    std::string tmpm = path + "m";
    std::string get_final = "bedops -u ";
    int i = 0;
    while (lines(path) > 0) {
      std::string ipath = path + std::to_string(i);
      get_final += ipath + " ";
      std::cout << "rDHS::_cluster: iteration " << ++i << "\n";
      exec("bedops -m --range 0:-1 " + path + " | bedops -u --range 0:1 - > " + tmpm);
      exec("bedmap --max-element " + tmpm + " " + path + " | sort-bed - > " + ipath);
      exec("bedops -n 1 " + path + " " + ipath + " > " + path + "_");
      std::rename((path + "_").c_str(), path.c_str());
    }
    exec(get_final + "> " + path);
    read(rDHSs, path);
  }

  rDHS::rDHS(const std::vector<std::string> &narrowPeakList,
	     const std::string &output_path) {
    std::vector<std::string> rawlines(0);
    for (auto path : narrowPeakList) {
      genlines(SCREEN::ZScore(path), trim_ext(basename(path)), rawlines);
    }
    rDHSs = std::vector<std::string>(0);
    cluster_and_read(rawlines, output_path, rDHSs);
  }

  rDHS::rDHS(const std::vector<std::string> &bedList, const std::vector<std::string> &bigWigList,
	     const std::string &output_path) {
    std::vector<std::string> rawlines(0);
    if (bedList.size() != bigWigList.size())
      throw std::invalid_argument("SCREEN::rDHS::rDHS: passed bedList and bigWigList have different lengths");
    for (auto i = 0; i < bedList.size(); ++i) {
      genlines(SCREEN::ZScore(bedList[i], bigWigList[i]), trim_ext(basename(bedList[i])), rawlines);
    }
    rDHSs = std::vector<std::string>(0);
    cluster_and_read(rawlines, output_path, rDHSs);
  }

  const std::string &rDHS::operator [](long index) {
    return rDHSs[index];
  }
  
}
