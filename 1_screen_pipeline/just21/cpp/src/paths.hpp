namespace SCREEN {

  class Paths {
  private:
    boost::filesystem::path root_;

  public:
    Paths(const boost::filesystem::path&);
    const boost::filesystem::path root() const;
    const boost::filesystem::path rDHS_list() const;
    const boost::filesystem::path DHS_ZScore_root(const std::string& = "ENCODE") const;
    const boost::filesystem::path DHS_ZScore(const std::string&, const std::string& = "ENCODE") const;
    const boost::filesystem::path hotspot_list() const;
    const boost::filesystem::path CTS_root() const;
    const boost::filesystem::path CTS(const std::string&) const;
    const boost::filesystem::path CTA() const;
    const boost::filesystem::path saturation() const;
    

  };

} // SCREEN
