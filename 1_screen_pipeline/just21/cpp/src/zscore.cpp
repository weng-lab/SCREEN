#include <vector>
#include <fstream>
#include <iterator>
#include <string>
#include <cmath>
#include <numeric>

#include "../../common/zentLib/src/BigWigWrapper.hpp"

#include "gzstream/gzstream.hpp"
#include "utils.hpp"
#include "zscore.hpp"

namespace SCREEN {

  double mean(std::vector<double> &in) {
    return std::accumulate(in.begin(), in.end(), 0.0) / in.size();
  }

  /*
   *  appends the peaks from the given ZScore set to the list of lines in rawlines
   *  nameprefix is appended to the name column to distinguish DHSs from different files
   */
  void ZScore::write(const std::string &nameprefix, const std::string &path) {
    std::ofstream o(path);
    for (auto i = 0; i < lines.size(); ++i) {
      std::vector<std::string> cols(split(lines[i], '\t'));
      o << cols[0] << "\t" << cols[1] << "\t" << cols[2] << "\t" << nameprefix << "_" << cols[3] << "\t"
	<< (cols.size() >= 5 ? cols[4] : "0") << "\t" << (cols.size() >= 6 ? cols[5] : ".") << "\t"
	<< std::to_string(zscores[i]) << "\t-1\t" << (cols.size() >= 9 ? cols[8] : "-1") << "\n";
    }
  }

  /*
   *  computes a list of Z-scores for a given vector
   */
  std::vector<double> ZScore::ComputeZScores(std::vector<double> &in) {
    std::vector<double> retval(in.size());
    double average = mean(in);
    double sq_sum = std::inner_product(in.begin(), in.end(), in.begin(), 0.0);
    double stdev = std::sqrt(sq_sum / in.size() - average * average);
    for (auto i = 0; i < in.size(); ++i) retval[i] = (in[i] - average) / stdev;
    return retval;
  }

  /*
   *  reads a bed file into this object's "lines" member; may be gzipped or not
   */
  void ZScore::_read(const std::string &in) {
    lines = std::vector<std::string>();
    if (SCREEN::path_is_gzip(in)) {
      gz::igzstream _in(in.c_str());
      for (std::string row; std::getline(_in, row, '\n');) lines.push_back(row);
    } else {
      read(lines, in);
    }
  }

  /*
   *  reads a narrowPeak file and computes Z-scores for the peaks it contains
   *  Z-scores are computed from the values in column 7
   */
  ZScore::ZScore(const std::string &narrowPeakPath) {
    _read(narrowPeakPath);
    std::vector<double> zl(0);
    for (std::string &line : lines) {
      std::vector<std::string> cols(split(line, '\t'));
      zl.push_back(std::stof(cols[6]));
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
    for (std::string &line : lines) {
      std::vector<std::string> v(split(line, '\t'));
      std::vector<double> values = b.GetRangeAsVector(v[0], std::stoi(v[1]), std::stoi(v[2]));
      zl.push_back(mean(values));
    }
    zscores = ComputeZScores(zl);
  }
  
} // SCREEN
