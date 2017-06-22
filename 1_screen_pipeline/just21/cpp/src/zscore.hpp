namespace SCREEN {

  class ZScore {

  private:
    void _read(const std::string &);
    
  public:
    ZScore(const std::string &);
    ZScore(const std::string &, const std::string &);

    std::vector<double> ComputeZScores(std::vector<double> &);

    std::vector<std::string> lines;
    std::vector<double> zscores;
    
  };
  
} // SCREEN
