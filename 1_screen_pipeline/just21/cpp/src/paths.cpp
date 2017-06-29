#include <boost/filesystem.hpp>
#include <boost/filesystem/operations.hpp>
#include <boost/filesystem/path.hpp>

#include "paths.hpp"

namespace SCREEN {

  Paths::Paths(const boost::filesystem::path &root) {
    root_ = root;
  }

  const boost::filesystem::path Paths::root() const { return root_; }

  const boost::filesystem::path Paths::rDHS_list() const {
    return root_ / "rDHS.bed";
  }

  const boost::filesystem::path Paths::hotspot_list() const {
    return root_ / "Hotspot-List.txt";
  }

  const boost::filesystem::path Paths::DHS_ZScore_root(const std::string &dataset) const {
    return root_ / "DHS" / dataset;
  }

  const boost::filesystem::path Paths::DHS_ZScore(const std::string &accession,
						  const std::string &dataset) const {
    return DHS_ZScore_root(dataset) / (accession + ".zscore.bed");
  }

  const boost::filesystem::path Paths::CTS_root() const {
    return root_ / "CTS";
  }

  const boost::filesystem::path Paths::CTS(const std::string &accession) const {
    return CTS_root() / (accession + ".zscore.bed");
  }

  const boost::filesystem::path Paths::CTA() const {
    return root_ / "CTA.bed";
  }

  const boost::filesystem::path Paths::saturation() const {
    return root_ / "saturation.tsv";
  }

} // SCREEN
