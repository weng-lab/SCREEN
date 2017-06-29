#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;

  struct region {
    uint32_t  start;
    uint32_t  end;
    float score;
  };

  std::string regionToString(region);

  class RegionSet {

  private:
    std::unordered_map<std::string, std::vector<region>> regions_;
    void _append(const std::string&, int, float);

  public:
    RegionSet() {}
    RegionSet(std::unordered_map<std::string, std::vector<region>>);

    void appendRegionSet(const RegionSet&);
    void appendNarrowPeak(const bfs::path&, float = 0.05);
    void appendNarrowPeak(const std::string&, float = 0.05);
    void appendZ(const bfs::path&);
    void appendZ(const std::string&);

    const std::vector<region> &operator [](std::string &);
    const std::unordered_map<std::string, std::vector<region>> &regions() const;
    
    size_t total();
    void sort();
    RegionSet rDHS_Cluster();
    void write_binary(const std::string&, const bfs::path&);
    void read_binary(const std::string&, const bfs::path&);
    void write(const bfs::path&);

  };

} // SCREEN
