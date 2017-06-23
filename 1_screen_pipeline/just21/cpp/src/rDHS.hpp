#pragma once

namespace SCREEN {

  class rDHS {

  private:
    std::vector<std::string> rDHSs;
    
  public:
    rDHS(const std::vector<std::string>&, const std::string&);
    rDHS(const std::vector<std::string>&, const std::vector<std::string>&,
	 const std::string&);
    const std::string& operator [](size_t);
    
  };
  
} // SCREEN
