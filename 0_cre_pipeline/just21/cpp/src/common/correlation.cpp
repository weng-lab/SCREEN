//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#include <vector>
#include <string>
#include <unordered_map>

#include <armadillo>
#include <boost/filesystem.hpp>

#include "utils.hpp"
#include "lambda.hpp"
#include "region.hpp"
#include "rDHS.hpp"
#include "binarysignal.hpp"
#include "correlation.hpp"

namespace SCREEN {

  namespace bfs = boost::filesystem;
  namespace a = arma;

  /**
     compute the pairwise correlation of the regions for the given chromosome
     @returns: armadillo matrix containing pairwise correlation coefficients for the regions
   */
  a::Mat<float> runCorrelation(std::vector<ScoredRegionSet> &regions, const std::string &chr) {

    // create emptry matrix
    if (0 == regions.size()) return a::Mat<float>(0, 0);
    a::Mat<float> values(regions.size(), regions[0].regions_.regions_[chr].size());
    
    // populate with region scores
    for (auto i = 0; i < regions.size(); ++i) {
#pragma omp parallel for
      for (auto j = 0; j < regions[i].regions_.regions_[chr].size(); ++j) {
	values.at(i, j) = regions[i].regions_.regions_[chr][j].score;
      }
    }

    // return pairwise correlation
    return a::cor(values);

  }

  a::Mat<float> runCorrelation(BinarySignal &b, const std::vector<boost::filesystem::path> &signalfiles,
			       const std::string &chr, RegionSet &regions) {

    // create empty matrix
    if (0 == signalfiles.size()) return a::Mat<float>(0, 0);
    a::Mat<float> values(signalfiles.size(), regions.regions_.regions_[chr].size());
    
    // populate with region scores
    for (auto i = 0; i < signalfiles.size(); ++i) {
      a::Col<float> v = b.readSignal<RegionSet>(signalfiles[i], chr, regions);
#pragma omp parallel for
      for (auto j = 0; j < regions.regions_.regions_[chr].size(); ++j) {
	values.at(i, j) = v.at(j);
      }
    }

    // return pairwise correlation
    return a::cor(values);

  }

  /**
     write a computed pairwise correlation in JSON 2D array format to an output file
     @param corr: matrix containing the correlation coefficients
     @param output_path: output path to which to write the matrix
   */
  template <typename T>
  void writeCorrelation(const a::Mat<T> &corr, const bfs::path &output_path) {
    std::ofstream f(output_path.string());
    long i, j;
    f << '[';
    for (i = 0; i < corr.n_rows - 1; ++i) {
      for (j = 0; j < corr.n_cols - 1; ++j) {
	f << corr.at(i, j) << ',';
      }
      f << corr.at(i, j) << "],[";
    }
    for (j = 0; j < corr.n_cols - 1; ++j) {
      f << corr.at(i, j) << ',';
    }
    f << corr.at(i, j) << ']';
  }

  template void writeCorrelation<float>(const a::Mat<float> &corr, const bfs::path &output_path);
  template void writeCorrelation<double>(const a::Mat<double> &corr, const bfs::path &output_path);

} // SCREEN
