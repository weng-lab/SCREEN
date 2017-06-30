#include <vector>
#include <unordered_map>
#include <armadillo>

#include <boost/filesystem.hpp>
#include "zentLib/src/BigWigWrapper.hpp"
#include "cpp/files.hpp"

#include "utils.hpp"
#include "region.hpp"
#include "binarysignal.hpp"

namespace a = arma;

namespace SCREEN {

  /**
      load signal from a signal file for the region list and store in a local unordered_map by chromosome
      @param regions: RegionSet containing the reigons for which to obtain signal
      @param signal: path to the signal file
   */
  BinarySignal::BinarySignal(RegionSet &regions, const boost::filesystem::path &signal) {
    zentlib::BigWig b(signal);
    for (auto chr : regions.sorted_keys()) {
      values_[chr] = std::vector<Region>(regions[chr].size());
      for (auto i = 0; i < regions[chr].size(); ++i) {
	std::vector<double> values = b.GetRangeAsVector(chr, regions[chr][i].start, regions[chr][i].end);
	const a::vec v(values.data(), values.size(), false, true);
	values_[chr][i] = {regions[chr][i].start, regions[chr][i].end, a::mean(v)};
      }
    }
    sorted_keys_ = std::vector<std::string>(regions.sorted_keys());
  }

  /**
      load precomputed signal from a signal directory with files produced by BinarySignal::write
      @param signaldir: path to a directory previously passed as a parameter to BinarySignal::write
      @notes: directory should contain files named chr*.region.bin
   */
  BinarySignal::BinarySignal(const boost::filesystem::path &signaldir) {
    std::vector<boost::filesystem::path> signalfiles(list_files(signaldir));
    sorted_keys_.clear();
    for (const auto &file : signalfiles) {
      const std::vector<std::string> p = split(file.filename().string(), '.');
      sorted_keys_.push_back(p[0]);
      values_[p[0]] = bib::files::readPODvector<Region>(file);
    }
    std::sort(sorted_keys_.begin(), sorted_keys_.end());
  }

  /**
      write computed signal to a directory
      @param outpath: path to the directory to which to write
      @notes: output will be a list of files named chr*.region.bin
   */
  void BinarySignal::write(const boost::filesystem::path &outpath) {
    for (auto chr : sorted_keys_) {
      bib::files::writePODvector<Region>(outpath / (chr + ".region.bin"), values_[chr]);
    }
  }

} // SCREEN
