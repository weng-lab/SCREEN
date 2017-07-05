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
#include "binarysignal.hpp"

namespace SCREEN {

  namespace a = arma;

  /**
      performs parallel binarization of region signal for a set of signal files
      @param regions: RegionSet containing the regions for which to obtain signal
      @param signalfiles: list of signal files from which to extract signal
      @param outputdir: directory for output; subdirectories will be created for each signal file
   */
  void BinarizeSignal(RegionSet &regions, const std::vector<bfs::path> &signalfiles,
		      const bfs::path &outputdir) {

#pragma omp parallel for num_threads(16)
    for (auto i = 0; i < signalfiles.size(); ++i) {
      auto &signalfile = signalfiles[i];
      //      BinarySignal(regions, signalfile).write(outputdir / signalfile.filename());
    }

  }

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

  void BinarySignal::convertSignal(const bfs::path &signalfile) {
    zentlib::BigWig b(signalfile);
    bfs::create_directory(outputdir_ / bfs::basename(signalfile));
    for (const auto& kv : regions_.regions_.regions_){
      const auto& chr = kv.first;
      const auto& region = kv.second;
      std::vector<float> values(region.size());

      for (auto i = 0; i < region.size(); ++i) {
	std::vector<double> _values = b.GetRangeAsVector(chr, region[i].start, region[i].end);
	const a::vec v(_values.data(), _values.size(), false, true);
	values[i] = static_cast<float>(a::mean(v));
      }
      bib::files::writePODvector(outputdir_ / bfs::basename(signalfile) / (chr + ".bin"), values);
    }
  }

  std::vector<float> BinarySignal::readSignal(const std::string &chr, const bfs::path &signalfile) {
    return bib::files::readPODvector<float>(outputdir_ / "regions" / (chr + ".bin"));
  }

  /**
      load precomputed signal from a signal directory with files produced by BinarySignal::write
      @param signaldir: path to a directory previously passed as a parameter to BinarySignal::write
      @notes: directory should contain files named chr*.region.bin
   */
  BinarySignal::BinarySignal(const bfs::path &signaldir) {
    std::vector<bfs::path> signalfiles(list_files(signaldir));
    for (const auto& fnp : signalfiles) {
      const std::vector<std::string> p = split(fnp.filename().string(), '.');
      values_[p[0]] = bib::files::readPODvector<Region>(fnp);
    }
  }

} // SCREEN
