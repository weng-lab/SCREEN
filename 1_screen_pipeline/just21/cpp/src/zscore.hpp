#pragma once

namespace SCREEN {

  class ZScore {

  private:
    void _read(const std::string &);
    
  public:
    ZScore();
    ZScore(const std::string &, bool);
    ZScore(const std::string &, const std::string &, bool);

    void write(const std::string&, const boost::filesystem::path&);
    void write(const std::string &, const std::string &);
    void read(const boost::filesystem::path&);
    void qfilter(double);
    std::vector<double> ComputeZScores(std::vector<double> &);

    std::vector<std::vector<std::string>> lines;
    std::vector<double> zscores;
    
  };
  
} // SCREEN
