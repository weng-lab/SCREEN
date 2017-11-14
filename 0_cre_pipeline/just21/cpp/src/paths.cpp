#include <boost/filesystem.hpp>
#include <boost/filesystem/operations.hpp>

#include "paths.hpp"

namespace SCREEN {
  bfs::path Paths::root() const { return root_; }

  bfs::path Paths::similarity(const std::string &assay, const std::string &accession) {
    return root_ / "similarity" / (accession + ".bed");
  }

  bfs::path Paths::rDHS_list() const {
    return root_ / "rDHS.bed";
  }

  bfs::path Paths::hotspot_list() const {
    return root_ / "Hotspot-List.txt";
  }

  bfs::path Paths::DHS_ZScore_root(const std::string &dataset) const {
    return root_ / "DHS" / dataset;
  }

  bfs::path Paths::DHS_ZScore(const std::string &accession,
			      const std::string &dataset) const {
    return DHS_ZScore_root(dataset) / (accession + ".zscore.bed");
  }

  bfs::path Paths::CTS_root() const {
    return root_ / "CTS";
  }

  bfs::path Paths::CTS(const std::string &accession) const {
    return CTS_root() / (accession + ".zscore.bed");
  }

  bfs::path Paths::CTA() const {
    return root_ / "CTA.bed";
  }

  bfs::path Paths::saturation() const {
    return root_ / "saturation.tsv";
  }
  
  bfs::path Paths::cistromeList() const {
    return "/data/projects/cREs/mm10/cistrome_list.txt";
  }
  
  bfs::path Paths::EncodeData(const std::string& expID, const std::string& fileID,
			      const std::string& ext) const{
    return bfs::path("/data/projects/encode/data/") / expID / (fileID + ext);
  }

  bfs::path Paths::chromInfo() const {
    return bfs::path("/data/common/genome/") / (assembly_ + ".chromInfo");
  }

  bfs::path Paths::screen_raw() const {
    return bfs::path("/data/projects/screen/Version-4/ver10/") / assembly_ / "raw";
  }

  bfs::path Paths::correlation(const std::string &chr) const {
    return root_ / "correlations" / (chr + ".json");
  }

  bfs::path Paths::density(const std::string &assayname, uint32_t binsize) const {
    return root_ / "density" / (assayname + "." + std::to_string(binsize) + ".bed");
  }
  
} // SCREEN
