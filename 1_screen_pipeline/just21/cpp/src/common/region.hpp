#pragma once

namespace SCREEN {

  struct region {
    uint  start;
    uint  end;
    float score;
  };

  std::string regionToString(struct region);

  class RegionSet {

  private:
    std::unordered_map<std::string, std::vector<struct region>> regions_;
    void _append(const std::string&, int, float);
    std::vector<std::string> sorted_keys_;
    void _update_keys();

  public:
    RegionSet();
    RegionSet(std::unordered_map<std::string, std::vector<struct region>>);

    void appendRegionSet(const RegionSet&);
    void appendNarrowPeak(const boost::filesystem::path&, float = 0.05);
    void appendNarrowPeak(const std::string&, float = 0.05);
    void appendZ(const boost::filesystem::path&);
    void appendZ(const std::string&);

    const std::vector<struct region> &operator [](std::string &);
    const std::unordered_map<std::string, std::vector<struct region>> &regions() const;
    const std::vector<std::string> &sorted_keys() const;

    size_t total();
    void sort();
    RegionSet rDHS_Cluster();
    void write(const boost::filesystem::path&);

  };

} // SCREEN
