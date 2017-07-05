#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;
  void BinarizeSignal(RegionSet&, const std::vector<bfs::path>&, const bfs::path&);

  class BinarySignal {
    std::unordered_map<std::string, std::vector<Region>> values_;
    RegionSet regions_;
    bfs::path outputdir_;

  public:
    void convertSignal(const bfs::path&);
    std::vector<float> readSignal(const std::string&, const bfs::path&);
    BinarySignal(const bfs::path&);
    BinarySignal(const RegionSet&, const bfs::path&);
    
  };

} // SCREEN
