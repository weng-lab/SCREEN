namespace SCREEN {

  namespace bfs = boost::filesystem;

  class Paths {
  private:
    const bfs::path root_;

  public:
    Paths(const bfs::path& root)
      : root_(root)
    {}
    
    bfs::path root() const;
    bfs::path rDHS_list() const;
    bfs::path DHS_ZScore_root(const std::string& = "ENCODE") const;
    bfs::path DHS_ZScore(const std::string&, const std::string& = "ENCODE") const;
    bfs::path hotspot_list() const;
    bfs::path CTS_root() const;
    bfs::path CTS(const std::string&) const;
    bfs::path CTA() const;
    bfs::path saturation() const;

    bfs::path cistromeList() const;
    bfs::path EncodeData(const std::string& expID,
			 const std::string& fileID, const std::string& ext) const; 
  };

} // SCREEN
