#pragma once

#include <boost/filesystem.hpp>

namespace SCREEN {

  namespace bfs = boost::filesystem;

  class Paths {
  private:
    const bfs::path root_;
    const std::string assembly_;

  public:
    Paths(const bfs::path& root, const std::string& assembly)
      : root_(root / assembly), assembly_(assembly)
    {}

    Paths(const std::string &root, const std::string &assembly)
      : root_(bfs::path(root) / assembly), assembly_(assembly)
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
    bfs::path screen_raw() const;

    bfs::path cistromeList() const;
    bfs::path EncodeData(const std::string& expID,
			 const std::string& fileID, const std::string& ext) const; 
    bfs::path chromInfo() const;
  };

} // SCREEN
