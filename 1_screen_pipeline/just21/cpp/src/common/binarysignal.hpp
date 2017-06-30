#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;

  class BinarySignal {
    std::unordered_map<std::string, std::vector<Region>> values_;

  public:
    BinarySignal(const bfs::path&);
    BinarySignal(const RegionSet&, const bfs::path&);
    
    void write(const bfs::path&);
  };

} // SCREEN
