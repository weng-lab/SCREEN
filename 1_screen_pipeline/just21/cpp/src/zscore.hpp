#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;
  
  class ZScore {

  private:
    void _read(const std::string &);
    
  public:
    ZScore();
    ZScore(const std::string &, bool);
    ZScore(const std::string &, const std::string &, bool);

    void write(const std::string&, const bfs::path&);
    void write(const std::string &, const std::string &);
    void read(const bfs::path&);
    void qfilter(double);
    std::vector<double> ComputeZScores(std::vector<double> &);

    std::vector<std::vector<std::string>> lines;
    std::vector<double> zscores;
    
  };
  
} // SCREEN
