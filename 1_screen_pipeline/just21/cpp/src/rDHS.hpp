#pragma once

namespace SCREEN {

  class RegionSet;

  class rDHS {

  private:
    void _process(RegionSet&);

  public:
    rDHS(const boost::filesystem::path&);
    rDHS(const std::vector<std::string>&);
    const std::string& operator [](size_t);
    std::vector<std::string> rDHSs;
    
  };
  
} // SCREEN
