#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;
  namespace a = arma;
  void BinarizeSignal(RegionSet&, const std::vector<bfs::path>&, const bfs::path&);

  class BinarySignal {

  public:
    RegionSet regions_;
    bfs::path outputdir_;
    void convertSignal(const bfs::path&);
    void convertSignal(const bfs::path&, const std::string&);
    std::vector<float> readSignal(const std::string&, const bfs::path&);
    BinarySignal(const bfs::path&);
    BinarySignal(const RegionSet&, const bfs::path&);

    template<typename T>
    a::Col<float> readSignal(const bfs::path&, const std::string&, T&);

    ScoredRegionSet readSignal(const bfs::path&, RegionSet&);
    ScoredRegionSet readSignal(const bfs::path&, ScoredRegionSet&, ChrToRegions<int>&);
    ChrToRegions<int> findIndices(ScoredRegionSet&);
    
    //    extern template a::Col<float> readSignal<RegionSet>(const bfs::path&, const std::string&, RegionSet&);
    //extern template a::Col<float> readSignal<ScoredRegionSet>(const bfs::path&, const std::string&, ScoredRegionSet&);

  };

} // SCREEN
