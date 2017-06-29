#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;
  
  class RegionSet;

  class rDHS {

  private:
    void _process(RegionSet&);
    RegionSet regions;

  public:
    rDHS(const std::vector<std::string>&);
    size_t total();
    void write(const boost::filesystem::path&);
    void write(const std::string&);
    std::vector<std::vector<std::string>> regionlist();
    
  };
  
} // SCREEN
