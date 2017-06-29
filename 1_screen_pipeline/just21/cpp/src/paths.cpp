#include <boost/filesystem.hpp>
#include <boost/filesystem/operations.hpp>

#include "paths.hpp"

namespace SCREEN {

  Paths::Paths(const bfs::path &root) {
    root_ = root;
  }

  const bfs::path Paths::root() const { return root_; }

  const bfs::path Paths::rDHS_list() const {
    return root_ / "rDHS.bed";
  }

  const bfs::path Paths::hotspot_list() const {
    return root_ / "Hotspot-List.txt";
  }

  const bfs::path Paths::DHS_ZScore_root(const std::string &dataset) const {
    return root_ / "DHS" / dataset;
  }

  const bfs::path Paths::DHS_ZScore(const std::string &accession,
						  const std::string &dataset) const {
    return DHS_ZScore_root(dataset) / (accession + ".zscore.bed");
  }

  const bfs::path Paths::CTS_root() const {
    return root_ / "CTS";
  }

  const bfs::path Paths::CTS(const std::string &accession) const {
    return CTS_root() / (accession + ".zscore.bed");
  }

  const bfs::path Paths::CTA() const {
    return root_ / "CTA.bed";
  }

  const bfs::path Paths::saturation() const {
    return root_ / "saturation.tsv";
  }

} // SCREEN
