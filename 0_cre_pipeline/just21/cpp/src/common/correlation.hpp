//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

namespace SCREEN {

  arma::Mat<float> runCorrelation(std::vector<ScoredRegionSet>&, const std::string&);
  arma::Mat<float> runCorrelation(BinarySignal&, const std::vector<boost::filesystem::path>&,
				  const std::string&, RegionSet&);

  template <typename T>
  void writeCorrelation(const arma::Mat<T>&, const boost::filesystem::path&);

  extern template void writeCorrelation<float>(const a::Mat<float> &corr, const bfs::path &output_path);
  extern template void writeCorrelation<double>(const a::Mat<double> &corr, const bfs::path &output_path);

} // SCREEN
