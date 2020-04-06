//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;
  
  class Saturation {

  private:
    std::vector<std::vector<size_t>> n_rDHSs;

  public:
    Saturation(const std::vector<ScoredRegionSet>&, int = 100);
    Saturation(const std::vector<ScoredRegionSet>&,
	       std::unordered_map<std::string, std::vector<int>>&, int = 100);
    void write(const bfs::path &b) const;

  };

} // SCREEN
