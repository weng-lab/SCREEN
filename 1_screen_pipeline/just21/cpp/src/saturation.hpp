namespace SCREEN {

  namespace bfs = boost::filesystem;
  
  class Saturation {

  private:
    std::vector<std::vector<size_t>> n_rDHSs;

  public:
    Saturation(const std::vector<RegionSet>&, int = 100);
    void write(const bfs::path &b) const;

  };

} // SCREEN
