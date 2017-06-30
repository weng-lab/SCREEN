#pragma once

#define ARMA_64BIT_WORD
#include <armadillo>

namespace SCREEN {

  namespace bfs = boost::filesystem;
  namespace a = arma;
  
  class ZScore {

  private:
    void _read(const bfs::path&);
    void computeZScores(const a::vec&);
    void computeZScores(const a::vec&, const a::vec&);
    void _processbw(const bfs::path&, const bool);
    
  public:
    ZScore() {}
    ZScore(const bfs::path&, const bool);
    ZScore(const bfs::path&, const bfs::path&, const bool);
    ZScore(const std::vector<std::vector<std::string>>&,
	   const bfs::path&, const bool);

    void write(const std::string&, const bfs::path&);
    void write(const std::string&, const std::string&);
    void read(const bfs::path&);
    void qfilter(const double);

    std::vector<std::vector<std::string>> lines_;
    a::vec zscores_;
  };
  
} // SCREEN
