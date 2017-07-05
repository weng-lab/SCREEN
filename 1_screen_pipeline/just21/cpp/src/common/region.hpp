#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;
  
  struct Region {
    uint32_t start;
    uint32_t end;
  };
  std::ostream& operator<<(std::ostream& s, const Region&);
  bool operator <(const Region &a, const Region &b);
  bool operator >(const Region &a, const Region &b);
  bool operator ==(const Region &a, const Region &b);

  using ChrToRegions = std::unordered_map<std::string, std::vector<Region>>;

  class RegionSet {
    ChrToRegions regions_;
    std::vector<std::string> sorted_keys_;
    void _update_keys();

  public:
    RegionSet() {}
    RegionSet(const ChrToRegions& regions)
      : regions_(regions)
    {}

    void appendRegionSet(const RegionSet&);
    void appendFile(const bfs::path&);
    void appendFile(const bfs::path&, RegionFilter&);

    const std::vector<Region>& operator [](const std::string&);
    const std::vector<Region>& operator [](const std::string&) const;
    void expandPeaks(size_t halfwidth);
    void expandPeaks(size_t halfwidth, ChrLengths&);

    const ChrToRegions& regions() const;
    const std::vector<std::string> &sorted_keys() const;
    
    size_t total();
    size_t find(const std::string&, const Region&);
    void sort();
    void unique();
    void write(const bfs::path&);

  };

} // SCREEN
