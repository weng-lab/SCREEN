namespace SCREEN {

  namespace bfs = boost::filesystem;

  class Paths {
  private:
    bfs::path root_;

  public:
    Paths(const bfs::path&);
    const bfs::path root() const;
    const bfs::path rDHS_list() const;
    const bfs::path DHS_ZScore_root(const std::string& = "ENCODE") const;
    const bfs::path DHS_ZScore(const std::string&, const std::string& = "ENCODE") const;
    const bfs::path hotspot_list() const;
    const bfs::path CTS_root() const;
    const bfs::path CTS(const std::string&) const;
    const bfs::path CTA() const;
    const bfs::path saturation() const;
  };

} // SCREEN
