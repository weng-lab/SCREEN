#include <vector>
#include <fstream>
#include <iterator>
#include <string>
#include <cmath>
#include <numeric>

#include <boost/filesystem.hpp>
#include <boost/filesystem/path.hpp>

#include "../../common/zentLib/src/BigWigWrapper.hpp"
#include "cpp/files.hpp"

#include "utils.hpp"
#include "zscore.hpp"

namespace SCREEN {

  double mean(std::vector<double> &in) {
    return  std::accumulate(in.begin(), in.end(), 0.0) / in.size();
  }

  void ZScore::write(const std::string &nameprefix, const boost::filesystem::path &path) {
    write(nameprefix, path.string());
  }

  /*
   *  appends the peaks from the given ZScore set to the list of lines in rawlines
   *  nameprefix is appended to the name column to distinguish DHSs from different files
   */
  void ZScore::write(const std::string &nameprefix, const std::string &path) {
    std::ofstream o(path);
    for (auto i = 0; i < lines.size(); ++i) {
      std::vector<std::string> &cols = lines[i];
      o << cols[0] << "\t" << cols[1] << "\t" << cols[2] << "\t" << nameprefix << "_" << cols[3] << "\t"
	<< std::to_string(zscores[i]) << "\t" << (cols.size() >= 6 ? cols[5] : ".") << "\t"
	<< std::to_string(zscores[i]) << "\t-1\t" << (cols.size() >= 9 ? cols[8] : "-1") << "\n";
    }
  }

  /*
   *  computes a list of Z-scores for a given vector
   */
  std::vector<double> ZScore::ComputeZScores(std::vector<double> &in) {
    std::vector<double> retval(in.size());
    if (in.size() <= 1) {
      return retval;
    }
    double average = mean(in);
    double sq_sum = std::inner_product(in.begin(), in.end(), in.begin(), 0.0);
    double stdev = std::sqrt(sq_sum / in.size() - average * average);
    for (auto i = 0; i < in.size(); ++i) {
      retval[i] = (in[i] - average) / stdev;
    }
    return retval;
  }

  /*
   *  reads a bed file into this object's "lines" member; may be gzipped or not
   */
  void ZScore::_read(const std::string &in) {
    lines = std::vector<std::vector<std::string>>();
    if (SCREEN::path_is_gzip(in)) {
      GZSTREAM::igzstream _in(in.c_str());
      for (std::string row; std::getline(_in, row, '\n');) {
	std::vector<std::string> v(split(row, '\t'));
	lines.push_back(v);
      }
    } else {
      std::ifstream _in(in);
      for (std::string row; std::getline(_in, row, '\n');) {
	std::vector<std::string> v(split(row, '\t'));
	lines.push_back(v);
      }
    }
  }

  /*
   *  filter items by the Q-score in column 9
   */
  void ZScore::qfilter(double qthreshold) {
    double nlog = -std::log10(qthreshold);
    std::vector<std::vector<std::string>> nl(0);
    std::vector<double> nz(0);
    for (auto i = 0; i < lines.size(); ++i) {
      std::vector<std::string> &cols = lines[i];
      if (cols.size() < 9) {
	continue;
      }
      if (std::stof(cols[8]) >= nlog) {
	nl.push_back(lines[i]);
	nz.push_back(zscores[i]);
      }
    }
    lines = nl;
    zscores = nz;
  }

  /*
   *  reads a narrowPeak file and computes Z-scores for the peaks it contains
   *  Z-scores are computed from the values in column 7
   */
  ZScore::ZScore(const std::string &narrowPeakPath) {
    _read(narrowPeakPath);
    std::vector<double> zl(0);
    for (std::vector<std::string> &line : lines) {
      zl.push_back(std::stof(line[6]));
    }
    zscores = ComputeZScores(zl);
  }

  /*
   *  reads a BED file and computes Z-scores for the peaks it contains
   *  Z-scores are computed from the average signal across each region as contained in the given bigWig
   */
  ZScore::ZScore(const std::string &bedPath, const std::string &bigWigPath) {
    _read(bedPath);
    zentlib::BigWig b(bigWigPath);
    std::vector<double> zl(0);
    for (std::vector<std::string> &line : lines) {
      std::vector<double> values = b.GetRangeAsVector(line[0],
						      std::stoi(line[1]),
						      std::stoi(line[2]));
      zl.push_back(mean(values));
    }
    zscores = ComputeZScores(zl);
  }
  
} // SCREEN
