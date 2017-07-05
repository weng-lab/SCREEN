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

  template <typename T>
  using ChrToRegions = std::unordered_map<std::string, std::vector<T>>;

  template <typename T>
  class GenericRegionSet {

  public:
    GenericRegionSet() {}
    GenericRegionSet(const ChrToRegions<T>& regions)
      : regions_(regions)
    {}

    ChrToRegions<T> regions_;
    std::vector<std::string> sorted_keys_;

    void appendGenericRegionSet(const GenericRegionSet&);

    std::vector<T>& operator [](const std::string&);
    std::vector<T>& operator [](const std::string&) const;
    void expandPeaks(size_t halfwidth);
    void expandPeaks(size_t halfwidth, ChrLengths&);

    const std::vector<std::string> &sorted_keys() const;
    
    void update_keys();
    size_t total();
    size_t find(const std::string&, const T&);
    void sort();
    void unique();
    void write(const bfs::path&);

  };

  class RegionSet {
  public:
    RegionSet() {}
    RegionSet(GenericRegionSet<Region> &regions) : regions_(regions) {}
    GenericRegionSet<Region> regions_;
    void appendFile(const bfs::path&);
    void appendFile(const bfs::path&, RegionFilter&);
  };
  
  extern template std::vector<Region> &GenericRegionSet<Region>::operator [](const std::string &chr);
  extern template const std::vector<std::string> &GenericRegionSet<Region>::sorted_keys() const;
  extern template void GenericRegionSet<Region>::unique();
  extern template void GenericRegionSet<Region>::expandPeaks(size_t halfwidth);
  extern template void GenericRegionSet<Region>::expandPeaks(size_t halfwidth, ChrLengths &chromInfo);
  extern template size_t GenericRegionSet<Region>::find(const std::string &chr, const Region &r);
  extern template void GenericRegionSet<Region>::update_keys();
  extern template void GenericRegionSet<Region>::appendGenericRegionSet(const GenericRegionSet<Region> &r);
  extern template void GenericRegionSet<Region>::write(const boost::filesystem::path &path);
  extern template size_t GenericRegionSet<Region>::total();
  extern template void GenericRegionSet<Region>::sort();

} // SCREEN
