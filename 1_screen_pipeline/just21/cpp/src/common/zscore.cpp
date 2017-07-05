#include <vector>
#include <fstream>
#include <iterator>
#include <string>
#include <cmath>
#include <numeric>
#include <unordered_map>

#include <boost/filesystem.hpp>

#include "zentLib/src/BigWigWrapper.hpp"
#include "cpp/files.hpp"
#include "cpp/string_utils.hpp"

#include "utils.hpp"
#include "lambda.hpp"
#include "region.hpp"
#include "zscore.hpp"

namespace SCREEN {

  double log10orNeg10(double x) {
    // TODO: floating point tolerance?
    // http://realtimecollisiondetection.net/blog/?p=89
    if (0.0 == x){
      return -10.0;
    }
    return std::log10(x + 0.01);
  }

  std::vector<float> _computeMaxZ(const std::vector<std::string> &paths, const std::vector<std::vector<std::string>> &regionlist,
				  std::vector<ZScore> &output_list) {

    // empty max-Z vector
    std::vector<float> maxZ(regionlist.size(), -10.0);
  
    // compute Z-scores
#pragma omp parallel for
    for (auto i = 0; i < paths.size(); ++i) {
      output_list[i] = ZScore(regionlist, paths[i], true);
      for (auto n = 0; n < regionlist.size(); ++n) {
	if (maxZ[n] < output_list[i].zscores_[n]) { maxZ[n] = output_list[i].zscores_[n]; }
      }
    }

    // return maxZ list
    return maxZ;
  
  }

  /*
   *  reads a narrowPeak file and computes Z-scores for the peaks it contains
   *  Z-scores are computed from the values in column 7
   */
  ZScore::ZScore(const bfs::path& narrowPeakPath, const bool uselog) {
    _read(narrowPeakPath);
    a::vec zl(lines_.size());
    for(size_t i = 0; i < lines_.size(); ++i){
      const auto& toks = lines_[i];
      zl[i] = uselog ? log10orNeg10(std::stof(toks[6])) : std::stof(toks[6]);
    }
    computeZScores(zl);
  }

  /*
   *  computes Z-scores for a set of regions against a given signal file
   */
  ZScore::ZScore(const std::vector<std::vector<std::string>> &regions,
		 const bfs::path& bigWigFnp,
		 const bool uselog) {
    lines_ = regions;
    _processbw(bigWigFnp, uselog);
  }
  
  /*
   *  reads a BED file and computes Z-scores for the peaks it contains
   *  Z-scores are computed from the average signal across each region as contained in the given bigWig
   */
  ZScore::ZScore(const bfs::path& bedPath, const bfs::path& bigWigPath,
		 const bool uselog) {
    _read(bedPath);
    _processbw(bigWigPath, uselog);
  }

  void ZScore::read(const bfs::path& path) {
    _read(path);
    zscores_ = a::vec(lines_.size());
    for (size_t i = 0; i < lines_.size(); ++i){
      zscores_[i] = std::stof(lines_[i][4]);
    }
  }

  void ZScore::write(const std::string& nameprefix, const bfs::path& path) {
    write(nameprefix, path.string());
  }

  /*
   *  appends the peaks from the given ZScore set to the list of lines in rawlines
   *  nameprefix is appended to the name column to distinguish DHSs from different files
   */
  void ZScore::write(const std::string& nameprefix, const std::string& path) {
    std::ofstream o(path);
    for (auto i = 0; i < lines_.size(); ++i) {
      std::vector<std::string>& cols = lines_[i];
      o << cols[0] << "\t" << cols[1] << "\t" << cols[2] << "\t" << nameprefix << "_" << cols[3] << "\t"
	<< std::to_string(zscores_[i]) << "\t" << (cols.size() >= 6 ? cols[5] : ".") << "\t"
	<< std::to_string(zscores_[i]) << "\t-1\t" << (cols.size() >= 9 ? cols[8] : "-1") << "\n";
    }
  }

  /*
   *  computes a list of Z-scores for a given vector
   */
  void ZScore::computeZScores(const a::vec& in) {
    if(!in.size()){
      return;
    }
    const double average = a::mean(in);
    const double stdev = a::stddev(in);
    zscores_ = (in - average) / stdev;
  }

  /*
   *  apparently we do not take signals of 0 into account for the average/stdev...
   *  intended to be called when uselog is true
   */
  void ZScore::computeZScores(const a::vec &in, const a::vec &toavg) {
    if (!in.size() || !toavg.size()) { return; }
    const double average = a::mean(toavg);
    const double stdev = a::stddev(toavg);
    zscores_ = (in - average) / stdev;
  }

  /*
   *  reads a bed file into this object's "lines" member; may be gzipped or not
   */
  void ZScore::_read(const bfs::path& bedFnp) {
    lines_.clear();

    const auto bed = bib::files::readStrings(bedFnp);
    for(const auto& row : bed){
      const auto toks = bib::string::split(row, '\t');
      if (toks.size() >= 9) {
	lines_.push_back(toks);
      }
    }
  }

  /*
   *  filter items by the Q-score in column 9
   */
  void ZScore::qfilter(double qthreshold) {
    const double nlog = -std::log10(qthreshold);
    std::vector<std::vector<std::string>> nl;
    std::vector<double> nz;
    for (auto i = 0; i < lines_.size(); ++i) {
      std::vector<std::string>& cols = lines_[i];
      if (cols.size() >= 9 && std::stof(cols[8]) > nlog) {
	nl.push_back(lines_[i]);
	nz.push_back(zscores_[i]);
      }
    }
    lines_ = nl;
    zscores_ = a::vec(nz);
  }

  void ZScore::_processbw(const bfs::path& bigWigFnp, const bool uselog) {
    zentlib::BigWig b(bigWigFnp);
    std::vector<double> zl, zm;
    for (const std::vector<std::string>& line : lines_) {
      std::vector<double> values = b.GetRangeAsVector(line[0],
						      std::stoi(line[1]),
						      std::stoi(line[2]));
      const a::vec v(values.data(), values.size(), false, true);
      double m = a::mean(v);
      if (!uselog) {
	zl.push_back(m);
      } else {
	zl.push_back(std::log10(m + 0.01));
	if (m > 0.0) { zm.push_back(std::log10(m)); }
      }
    }
    if (!uselog) {
      computeZScores(zl);
    } else {
      computeZScores(zl, zm);
    }
  }
  
} // SCREEN
