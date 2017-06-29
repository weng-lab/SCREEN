#pragma once

#define ARMA_64BIT_WORD
#include <armadillo>

namespace SCREEN {

  namespace bfs = boost::filesystem;
  namespace a = arma;
  
  class ZScore {

  private:
    void _read(const std::string &);
    void computeZScores(const a::vec&);
    
  public:
    ZScore() {}
    ZScore(const std::string &, const bool);
    ZScore(const std::string &, const std::string &, const bool);

    void write(const std::string&, const bfs::path&);
    void write(const std::string &, const std::string &);
    void read(const bfs::path&);
    void qfilter(const double);

    std::vector<std::vector<std::string>> lines_;
    a::vec zscores_;
  };
  
} // SCREEN
