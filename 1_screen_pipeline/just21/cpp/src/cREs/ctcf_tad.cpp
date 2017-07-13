#include <vector>
#include <fstream>
#include <unordered_map>

#include <boost/filesystem.hpp>
#include "cpp/files.hpp"
#include "cpp/string_utils.hpp"

#include "../common/utils.hpp"
#include "../common/lambda.hpp"
#include "../common/region.hpp"
#include "../common/rDHS.hpp"
#include "ctcf_tad.hpp"

namespace SCREEN {

  namespace bfs = boost::filesystem;

  uint32_t max_end(const std::vector<CTCF_cRE> &list) {
    uint32_t result = 0;
    for (const auto &cRE : list) {
      if (result < cRE.end) { result = cRE.end; }
    }
    return result;
  }

  CTCF_TAD::CTCF_TAD(const std::vector<bfs::path> &cts_files) {
    
    // read first file to populate vector
    std::cout << "reading file 1/" << cts_files.size() << '\n';
    std::vector<std::string> lines = bib::files::readStrings(cts_files[0]);
    for (const auto &line : lines) {
      std::vector<std::string> p = bib::string::split(line, '\t');
      if (p.size() < 4) {
	std::cout << "CTCF_TAD::CTCF_TAD: skipping " << line << ": <5 elements\n";
	continue;
      }
      cREs_[p[0]].push_back({
	std::stoi(p[1]),
	std::stoi(p[2]),
	std::stof(p[3]) > 1.64 ? 1 : 0
      });
    }

    // read rest of files
    std::string cchrom = "";
    uint32_t idx = 0;
    for (auto i = 1; i < cts_files.size(); ++i) {
      std::cout << "CTCF_TAD::CTCF_TAD: reading file " << (i + 1) << '/' << cts_files.size() << '\n';
      std::vector<std::string> lines = bib::files::readStrings(cts_files[i]);
      for (auto j = 0; j < lines.size(); ++j) {
	const auto &line = lines[j];
	std::vector<std::string> p = bib::string::split(line, '\t');
	if (p.size() < 4) {
	  std::cout << "CTCF_TAD::CTCF_TAD: skipping " << line << ": <5 elements\n";
	  continue;
	}
	if (0 != cchrom.compare(p[0])) {
	  cchrom = p[0]; idx = 0;
	}
	if (std::stof(p[3]) > 1.64) {
	  cREs_[p[0]][idx] = {
	    cREs_[p[0]][idx].start,
	    cREs_[p[0]][idx].end,
	    cREs_[p[0]][idx].n_celltypes + 1
	  };
	}
	++idx;
      }
    }

  }

  void CTCF_TAD::write(const bfs::path &output_path, uint32_t binsize) {
    
    std::ofstream f(output_path.string());

    // for each chromosome
    for (auto &kv : cREs_) {

      // shorthand and compute number of bins
      auto &chr = kv.first;
      auto &regionlist = kv.second;
      std::vector<float> results(max_end(regionlist) / binsize + 1, 0.0);
      
      // for each region
      for (auto j = 0; j < regionlist.size(); ++j) {

	// compute bins
	const auto &region = regionlist[j];
	uint32_t firstbin = region.start / binsize, secondbin = region.end / binsize;

	// find number of bins overlapping this cRE and add to each
	if (firstbin == secondbin) {
	  results[firstbin] += (float)region.n_celltypes * (float)(region.end - region.start);
	} else {
	  results[firstbin] += (float)region.n_celltypes * (float)((firstbin + 1) * binsize - region.start);
	  for (auto i = firstbin + 1; i < secondbin; ++i) {
	    results[i] += (float)region.n_celltypes * (float)binsize;
	  }
	  results[secondbin] += (float)region.n_celltypes * (float)(region.end - (secondbin * binsize));
	}

      } // for each region

      // write each bin
      for (auto i = 0; i < results.size(); ++i) {
	f << chr << '\t' << (i * binsize + 1) << '\t' << ((i + 1) * binsize) << '\t' << results[i] << '\n';
      }

    } // for each chromosome

  }

} // SCREEN
