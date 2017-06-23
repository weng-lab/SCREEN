#pragma once

namespace SCREEN {

  class ZScore {

  private:
    void _read(const std::string &);
    
  public:
    ZScore(const std::string &);
    ZScore(const std::string &, const std::string &);

    void write(const std::string &, const std::string &);
    void qfilter(double);
    std::vector<double> ComputeZScores(std::vector<double> &);

    std::vector<std::vector<std::string>> lines;
    std::vector<double> zscores;
    
  };
  
} // SCREEN
