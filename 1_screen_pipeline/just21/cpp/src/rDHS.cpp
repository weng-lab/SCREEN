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
    std::vector<std::string> chromlist = chrom_list(path);

#pragma omp parallel for num_threads(32)
    for (auto i = 0; i < chromlist.size(); ++i) {
      std::string chr = chromlist[i];
      std::string cpath = path + chr + "_";
      std::string tmpm = cpath + "m_";
      exec("bedextract " + chr + " " + path + " > " + cpath);
      while (lines(cpath) > 0) {
	std::string ipath = cpath + std::to_string(i);
	get_final += ipath + " ";
	exec("bedops -m --range 0:-1 " + cpath + " | bedops -u --range 0:1 - > " + tmpm);
	exec("bedmap --max-element " + tmpm + " " + cpath + " | sort-bed - > " + ipath);
	exec("bedops -n 1 " + cpath + " " + ipath + " > " + cpath + "_");
	std::rename((cpath + "_").c_str(), cpath.c_str());
      }
      std::cout << "rDHS::_cluster: " + chr + " complete\n";
    }

    exec(get_final + "> " + path);
    read(rDHSs, path);

  }

  rDHS::rDHS(const std::vector<std::string> &narrowPeakList,
	     const std::string &output_path) {
    std::vector<std::string> rawlines(0);
    for (auto path : narrowPeakList) {
      read(rawlines, path);
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
      std::cout << "reading file " << (i + 1) << " / " << bedList.size() << "\r" << std::flush;
      //genlines(SCREEN::ZScore(bedList[i], bigWigList[i]), trim_ext(basename(bedList[i])), rawlines);
    }
    std::cout << std::endl;
    rDHSs = std::vector<std::string>(0);
    cluster_and_read(rawlines, output_path, rDHSs);
  }

  const std::string &rDHS::operator [](long index) {
    return rDHSs[index];
  }
  
}
