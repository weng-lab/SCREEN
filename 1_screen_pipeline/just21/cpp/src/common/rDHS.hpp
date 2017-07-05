#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;
  
  class RegionSet;

  class rDHS {

  private:
    void _process(RegionSet&);
    RegionSet regions;

  public:
    rDHS();
    rDHS(const std::vector<bfs::path>&);
    size_t total();
    void write(const boost::filesystem::path&);
    void write(const std::string&);
    std::vector<std::vector<std::string>> regionlist();
    void expandPeaks(size_t, ChrLengths&);
    void expandPeaks(size_t);
    
  };
  
} // SCREEN
