#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;
  
  struct Region {
    uint32_t start;
    uint32_t end;
    float score;
  };
  std::ostream& operator<<(std::ostream& s, const Region&);

  using ChrToRegions = std::unordered_map<std::string, std::vector<Region>>;

  class RegionSet {
    ChrToRegions regions_;
    void _append(const std::string&, int, float);

  public:
    RegionSet() {}
    RegionSet(const ChrToRegions& regions)
      : regions_(regions)
    {}

    void appendRegionSet(const RegionSet&);
    void appendNarrowPeak(const bfs::path&, float = 0.05);
    void appendNarrowPeak(const std::string&, float = 0.05);
    void appendZ(const bfs::path&);
    void appendZ(const std::string&);

    const std::vector<Region>& operator [](std::string&);
    const ChrToRegions& regions() const;
    
    size_t total();
    void sort();
    RegionSet rDHS_Cluster();
    void write_binary(const std::string&, const bfs::path&);
    void read_binary(const std::string&, const bfs::path&);
    void write(const bfs::path&);

  };

} // SCREEN
