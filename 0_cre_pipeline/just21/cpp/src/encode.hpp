#pragma once

#define DHS_FDR_THRESHOLD 0.001

namespace SCREEN {

  class BinarySignal;

  struct ENCODEFile {
    std::string exp;
    std::string acc;
  };

  class ENCODE {
    
    void _load_DHS_paths();
    void _load_signallists();
    Paths path_;
    std::string assembly_;

    std::vector<ENCODEFile> _readlist(const std::string&);    

    std::vector<ENCODEFile> DHS_signal_;
    std::vector<ENCODEFile> DHS_peaks_;

    void _write_cREs(const std::vector<ENCODEFile>&, const std::vector<std::vector<std::string>>&,
		     const std::vector<ZScore>&, const std::vector<int>&);
    std::vector<ScoredRegionSet> _computeMaxZ(std::vector<ENCODEFile>&, ScoredRegionSet&, const std::string&);
    void _binarize_list(const std::vector<ENCODEFile>&, BinarySignal&);

    rDHS rDHS_;
    ChrLengths chrom_info_;

  public:
    std::vector<ENCODEFile> dnase_list_, h3k4me3_list_, h3k27ac_list_, ctcf_list_;

    ENCODE(const bfs::path&, const std::string&);
    void computeZScores(bool = false);
    void make_rDHS(bool = false);
    void load_rDHS();
    void create_cREs();
    void make_saturation();
    void binarizeDHS();
    void binarize_rDHS();
    void _binarize(RegionSet&, const std::string&);
    void _binarize(RegionSet&, const std::string&, ENCODEFile);
    void runCorrelation();
    void similar_DNase_jaccard();
    void compute_density(const std::string&, const std::vector<ENCODEFile>&, uint32_t = 100000);
    void binarizeLookupMatrix(LookupMatrix&);

  };

} // SCREEN
