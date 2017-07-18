#include <vector>
#include <unordered_map>
#include <armadillo>

#include <boost/filesystem.hpp>
#include "zentLib/src/BigWigWrapper.hpp"
#include "cpp/files.hpp"
#include "cpp/string_utils.hpp"

#include "lambda.hpp"
#include "utils.hpp"
#include "region.hpp"
#include "rDHS.hpp"
#include "binarysignal.hpp"

namespace SCREEN {

  namespace a = arma;

  /**
      load signal from a signal file for the region list and store in a local unordered_map by chromosome
      @param regions: RegionSet containing the reigons for which to obtain signal
      @param signal: path to the signal file
   */
  BinarySignal::BinarySignal(const RegionSet& regions,
			     const bfs::path& outputdir) : outputdir_(outputdir), regions_(regions) {
    bfs::create_directory(outputdir_);
    bfs::create_directory(outputdir_ / "regions");
    for (const auto &kv : regions_.regions_.regions_) {
      bib::files::writePODvector(outputdir_ / "regions" / (kv.first + ".bin"), kv.second);
    }
  }

  void BinarySignal::convertSignal(const bfs::path &signalfile, bool force_rewrite) {
    zentlib::BigWig b(signalfile);
    bfs::create_directory(outputdir_ / bfs::basename(signalfile));
    std::cout << signalfile << '\t' << regions_.regions_.regions_.size() << '\n';
    for (const auto& kv : regions_.regions_.regions_){
      const auto& chr = kv.first;
      const auto& region = kv.second;
      if (!force_rewrite && bfs::exists(outputdir_ / bfs::basename(signalfile) / (chr + ".bin"))) { continue; }
      std::vector<float> values(region.size());

      for (auto i = 0; i < region.size(); ++i) {
	std::vector<double> _values = b.GetRangeAsVector(chr, region[i].start, region[i].end);
	const a::vec v(_values.data(), _values.size(), false, true);
	values[i] = static_cast<float>(a::mean(v));
      }
      std::cout << (outputdir_ / bfs::basename(signalfile) / (chr + ".bin")) << '\n';
      bib::files::writePODvector(outputdir_ / bfs::basename(signalfile) / (chr + ".bin"), values);
    }
  }

  void BinarySignal::convertSignal(const bfs::path &signalfile, const std::string &chr) {
    zentlib::BigWig b(signalfile);
    bfs::create_directory(outputdir_ / bfs::basename(signalfile));
    std::cout << signalfile << '\t' << regions_.regions_.regions_.size() << '\n';
    const auto& region = regions_.regions_.regions_[chr];
    std::vector<float> values(region.size());

    for (auto i = 0; i < region.size(); ++i) {
      std::vector<double> _values = b.GetRangeAsVector(chr, region[i].start, region[i].end);
      const a::vec v(_values.data(), _values.size(), false, true);
      values[i] = static_cast<float>(a::mean(v));
    }
    std::cout << (outputdir_ / bfs::basename(signalfile) / (chr + ".bin")) << '\n';
    bib::files::writePODvector(outputdir_ / bfs::basename(signalfile) / (chr + ".bin"), values);
  }

  std::vector<float> BinarySignal::readSignal(const std::string &chr, const bfs::path &signalfile) {
    return bib::files::readPODvector<float>(outputdir_ / bfs::basename(signalfile) / (chr + ".bin"));
  }

  /**
      load precomputed signal from a signal directory with files produced by BinarySignal::write
      @param signaldir: path to a directory previously passed as a parameter to BinarySignal::write
      @notes: directory should contain files named chr*.region.bin
   */
  BinarySignal::BinarySignal(const bfs::path &signaldir) : outputdir_(signaldir) {
    std::vector<bfs::path> signalfiles(list_files(signaldir / "regions"));
    for (const auto& fnp : signalfiles) {
      const std::vector<std::string> p = split(fnp.filename().string(), '.');
      regions_.regions_[p[0]] = bib::files::readPODvector<Region>(fnp);
    }
  }

  /**
      load precomputed signal from an experiment for a particular subset of regions
      @param signalfile: file for which to load signal
      @param chr: chromosome on which the regions reside
      @param regions: list of regions for which to load signal; must be sorted
   */
  template <typename T>
  a::Col<float> BinarySignal::readSignal(const bfs::path &signalfile, const std::string &chr, T &regions) {
    a::Col<float> retval(regions.regions_.total());
    retval.fill(-1.0);
    std::vector<float> s = readSignal(chr, signalfile);
    int j = 0;
    for (auto i = 0; i < regions.regions_[chr].size(); ++i) {
      while (j < s.size() && regions_.regions_[chr][j] < regions.regions_[chr][i]) ++j;
      if (regions_.regions_[chr][j] == regions.regions_[chr][i]) retval[i] = s[j];
    }
    return retval;
  }
  template a::Col<float> BinarySignal::readSignal<RegionSet>(const bfs::path &signalfile, const std::string &chr, RegionSet &regions);
  template a::Col<float> BinarySignal::readSignal<ScoredRegionSet>(const bfs::path &signalfile, const std::string &chr, ScoredRegionSet &regions);

  ScoredRegionSet BinarySignal::readSignal(const bfs::path &signalfile, RegionSet &regions) {
    ScoredRegionSet retval;
    for (auto &kv : regions.regions_.regions_) {
      auto &chr = kv.first;
      auto &cregions = kv.second;
      std::vector<float> s = readSignal(chr, signalfile);
      retval.regions_[chr] = std::vector<RegionWithScore>(cregions.size());
      int j = 0;
      for (auto i = 0; i < cregions.size(); ++i) {
	while (j < s.size() && regions_.regions_[chr][j] < cregions[i]) ++j;
	if (regions_.regions_[chr][j] == cregions[i]) retval.regions_[chr][i] = { regions_.regions_[chr][j].start, regions_.regions_[chr][j].end, s[j] };
      }
    }
    retval.regions_.update_keys();
    return retval;
  }

  ChrToRegions<int> BinarySignal::findIndices(ScoredRegionSet &regions) {
    ChrToRegions<int> retval;
    std::cout << "finding indices...\n";
    for (auto &kv : regions.regions_.regions_) {
      auto &chr = kv.first;
      auto &cregions = kv.second;
      retval[chr] = std::vector<int>(cregions.size());
      for (auto i = 0; i < cregions.size(); ++i) {
	retval[chr][i] = regions.regions_.find(chr, { cregions[i].start, cregions[i].end });
      }
    }
    std::cout << "done finding indices\n";
    return retval;
  }

  ScoredRegionSet BinarySignal::readSignal(const bfs::path &signalfile, ScoredRegionSet &regions, ChrToRegions<int> &indices) {
    ScoredRegionSet retval;
    for (auto &kv : regions.regions_.regions_) {
      auto &chr = kv.first;
      auto &cregions = kv.second;
      std::vector<float> s = readSignal(chr, signalfile);
      retval.regions_.regions_[chr] = std::vector<RegionWithScore>(cregions.size());
      for (auto i = 0; i < cregions.size(); ++i) {
	if (indices[chr][i] != -1 && indices[chr][i] < s.size()) {
	  retval.regions_.regions_[chr][i] = { cregions[i].start, cregions[i].end, s[indices[chr][i]] };
	} else {
	  retval.regions_.regions_[chr][i] = { cregions[i].start, cregions[i].end, 0.0 };
	}
      }
    }
    retval.regions_.update_keys();
    return retval;    
  }

} // SCREEN
