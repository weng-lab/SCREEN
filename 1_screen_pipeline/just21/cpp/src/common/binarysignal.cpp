#include <vector>
#include <unordered_map>
#include <armadillo>

#include <boost/filesystem.hpp>
#include "zentLib/src/BigWigWrapper.hpp"
#include "cpp/files.hpp"

#include "utils.hpp"
#include "region.hpp"
#include "binarysignal.hpp"

namespace SCREEN {

  namespace a = arma;

  /**
      load signal from a signal file for the region list and store in a local unordered_map by chromosome
      @param regions: RegionSet containing the reigons for which to obtain signal
      @param signal: path to the signal file
   */
  BinarySignal::BinarySignal(const RegionSet& regions, const bfs::path& signalFnp) {
    zentlib::BigWig b(signalFnp);
    for (const auto& kv : regions.regions()){
      const auto& chr = kv.first;
      const auto& region = kv.second;
      values_[chr] = std::vector<Region>(region.size());
      
      for (auto i = 0; i < region.size(); ++i) {
	std::vector<double> values = b.GetRangeAsVector(chr, region[i].start, region[i].end);
	const a::vec v(values.data(), values.size(), false, true);
	values_[chr][i] = {region[i].start, region[i].end,
			   static_cast<float>(a::mean(v))};
      }
    }
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

  /**
      write computed signal to a directory
      @param outpath: path to the directory to which to write
      @notes: output will be a list of files named chr*.region.bin
   */
  void BinarySignal::write(const bfs::path &outFnp) {
    for (const auto& kv : values_){
      const auto& chr = kv.first;
      const auto& values = kv.second;
      bib::files::writePODvector<Region>(outFnp / (chr + ".region.bin"), values);
    }
  }

} // SCREEN
