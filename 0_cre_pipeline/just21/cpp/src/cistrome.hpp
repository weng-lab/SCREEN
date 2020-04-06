//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#pragma once

#define DHS_FDR_THRESHOLD 0.001

namespace SCREEN {

  class Cistrome {
    
    std::string assembly_;

    std::vector<bfs::path> dnase_files_;

    bfs::path root_;

    // void _write_cREs(const std::vector<ENCODEFile>&, const std::vector<std::vector<std::string>>&,
    //	     const std::vector<ZScore>&, const std::vector<int>&);
    // std::vector<ScoredRegionSet> _computeMaxZ(std::vector<ENCODEFile>&, ScoredRegionSet&, const std::string&);
    // void _binarize_list(const std::vector<ENCODEFile>&, BinarySignal&);

    rDHS rDHS_;

  public:
    std::vector<std::string> dnase_list_; //, h3k4me3_list_, h3k27ac_list_, ctcf_list_;

    Cistrome(const bfs::path&, const bfs::path&, const std::string&);
    void computeZScores(bool = false);
    void make_rDHS(bool = false);
    void load_rDHS();
    void make_saturation();
    // void create_cREs();
    // void binarizeDHS();
    // void binarize_rDHS();
    // void _binarize(RegionSet&, const std::string&);
    // void _binarize(RegionSet&, const std::string&, ENCODEFile);
    // void runCorrelation();
    // void similar_DNase_jaccard();
    // void compute_density(const std::string&, const std::vector<ENCODEFile>&, uint32_t = 100000);
    // void binarizeLookupMatrix(LookupMatrix&);

  };

} // SCREEN
