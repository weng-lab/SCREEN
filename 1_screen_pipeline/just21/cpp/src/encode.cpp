#include <vector>
#include <unordered_map>
#include <string>

#include <boost/filesystem.hpp>

#include "cpp/string_utils.hpp"
#include "cpp/files.hpp"

#include "common/utils.hpp"
#include "common/lambda.hpp"
#include "common/region.hpp"
#include "common/zscore.hpp"
#include "common/binarysignal.hpp"
#include "common/rDHS.hpp"
#include "common/saturation.hpp"
#include "paths.hpp"
#include "encode.hpp"

namespace SCREEN {

  ENCODE::ENCODE(const bfs::path &root, const std::string &assembly) : path_(Paths(root, assembly)), assembly_(assembly) {
    _load_DHS_paths();
    _load_signallists();
  }

  /**
     load the paths that will provide the raw DHSs
   */
  void ENCODE::_load_DHS_paths() {
    const auto lines = bib::files::readStrings(path_.hotspot_list());
    for (const auto &line : lines) {
      const auto cols = bib::string::split(line, '\t');
      DHS_signal_.push_back({ cols[0], cols[3] });
      DHS_peaks_.push_back({ cols[0], cols[1] });
    }
  }

  /**
     read a TSV into a list of ENCODEFile structs
     first column is exp accession, second is file accession
   */
  std::vector<ENCODEFile> ENCODE::_readlist(const std::string &assay) {
    const auto lines = bib::files::readStrings(path_.screen_raw() / (assay + "-list.txt"));
    std::vector<ENCODEFile> retval;
    for (const auto &line : lines) {
      std::vector<std::string> v = bib::string::split(line, '\t');
      retval.push_back({ v[0], v[1] });
    }
    return retval;
  }

  /**
     load the paths for computing the Z-scores for the core four marks
   */
  void ENCODE::_load_signallists() {
    dnase_list_ = _readlist("dnase");
    h3k4me3_list_ = _readlist("h3k4me3");
    h3k27ac_list_ = _readlist("h3k27ac");
    ctcf_list_ = _readlist("ctcf");
  }

  /**
      create binary signal files for all raw DHSs
  */
  void ENCODE::binarizeDHS() {
    RegionSet r;
    RegionFilter qfilter = QFilter(0.001);
    
    std::cout << "loading DHSs...\n";
    for (auto &peakfile : DHS_peaks_) {
      r.appendFile(path_.EncodeData(peakfile.exp, peakfile.acc, ".bed.gz"), qfilter);
    }
    r.regions_.unique();
    std::cout << "found " << r.regions_.total() << " unique DHSs\n";

    BinarySignal b(r, path_.root() / "DHS" / "signal");
    std::cout << "completed writing regions\n";
#pragma omp parallel for
    for (auto i = 0; i < DHS_signal_.size(); ++i) {
      b.convertSignal(path_.EncodeData(DHS_signal_[i].exp, DHS_signal_[i].acc, ".bigWig"));
      std::cout << "converted signal for " << i << "\n";
    }
    
  }

  /**
     compute Z-scores for all the raw DHSs
     results are saved to the Z-score output directory defined in the Paths class
   */
  void ENCODE::computeZScores(bool force_recompute) {

#pragma omp parallel for
    for (auto i = 0; i < DHS_signal_.size(); ++i) {
      
      if (force_recompute || !bfs::exists(path_.DHS_ZScore(DHS_signal_[i].acc))) {
	ZScore z(path_.EncodeData(DHS_peaks_[i].exp, DHS_peaks_[i].acc, ".bed.gz"),
		 path_.EncodeData(DHS_signal_[i].exp, DHS_signal_[i].acc, ".bigWig"),
		 false);
	z.qfilter(DHS_FDR_THRESHOLD);
	z.write(DHS_signal_[i].acc, path_.DHS_ZScore(DHS_signal_[i].acc));
	std::cout << DHS_signal_[i].acc << "\t" << z.zscores_.size() << "\n";
      }

    }

  }

  /**
     computes rDHSs; requires Z-score output from ENCODE::computeZScores
     saves results to the rDHS path defined in the Paths class
   */
  void ENCODE::make_rDHS() {

    // get paths to Z-score output
    std::vector<bfs::path> zpaths(DHS_signal_.size());
    for (auto i = 0; i < DHS_signal_.size(); ++i) {
      zpaths[i] = path_.DHS_ZScore(DHS_signal_[i].acc);
    }

    // compute rDHSs and write
    rDHS_ = rDHS(zpaths);
    rDHS_.write(path_.rDHS_list());
    std::cout << "wrote " << rDHS_.regions_.regions_.total() << " rDHSs to " << path_.rDHS_list() << "\n";

  }

  /**
     writes CTS cREs for an assay to output files
     @param paths: paths to the output files
     @param regionlist: list of rDHSs
     @param zscores: vector of ZScores, one for each path
     @param cREs: indices of rDHSs which are cREs
   */
  void ENCODE::_write_cREs(const std::vector<ENCODEFile> &paths, const std::vector<std::vector<std::string>> &regionlist,
			   const std::vector<ZScore> &zscores, const std::vector<int> &cREs) {

#pragma omp parallel for
    for (auto i = 0; i < paths.size(); ++i) {
      std::ofstream o(path_.CTS(paths[i].acc).string());
      for (auto n = 0; n < cREs.size(); ++n) {
	o << regionlist[cREs[n]][0] << "\t" << regionlist[cREs[n]][1] << "\t" << regionlist[cREs[n]][2] << "\t"
	  << accession(cREs[n], 'E') << "\t" << zscores[i].zscores_[cREs[n]] << "\n";
      }
    }
  
  }

  /**
     computes the maxZs for each rDHS for an assay
     @param list: list of signal files from which to compute Z scores
     @param regionlist: list of rDHSs
     @param output_list: vector to receive output Z-scores
     @returns: vector containing maxZ for each rDHS
   */
  std::vector<float> ENCODE::_computeMaxZ(std::vector<ENCODEFile> &list, std::vector<std::vector<std::string>> &regionlist,
					  std::vector<ZScore> &output_list) {
    std::vector<std::string> paths;
    for (auto &k : list) {
      paths.push_back(path_.EncodeData(k.exp, k.acc, ".bigWig").string());
    }
    return SCREEN::_computeMaxZ(paths, regionlist, output_list);
  }

  /**
     create cREs; requires output from ENCODE::make_rDHS
     output is saved to the CTA and CTS paths defined in the Paths class
   */
  /*
  void ENCODE::create_cREs() {
    
    // empty vectors for holding Z-scores, cREs
    std::vector<ZScore> DNaseZ(dnase_list_.size()), H3K4me3Z(h3k4me3_list_.size()),
      H3K27acZ(h3k27ac_list_.size()), CTCFZ(ctcf_list_.size());
    std::vector<int> cREs;

    // condense regions into vector, compute maxZ for DNase and CTCF
    std::vector<std::vector<std::string>> regionlist = rDHS_.regionlist();
    std::vector<float> max_DNaseZ = _computeMaxZ(dnase_list_, regionlist, DNaseZ);
    std::vector<float> max_CTCFZ = _computeMaxZ(ctcf_list_, regionlist, CTCFZ);

    // expand window by 500 bp then compute histone Z-scores
    ChrLengths chromInfo = parseChromLengths(path_.chromInfo());
    rDHS_.expandPeaks(500, chromInfo);
    regionlist = rDHS_.regionlist();
    std::vector<float> max_H3K4me3Z = _computeMaxZ(h3k4me3_list_, regionlist, H3K4me3Z);
    std::vector<float> max_H3K27acZ = _computeMaxZ(h3k27ac_list_, regionlist, H3K27acZ);

    // write CTA
    std::ofstream o(path_.CTA().string());
    for (auto i = 0; i < max_DNaseZ.size(); ++i) {
      if (max_DNaseZ[i] >= 1.64 && (max_H3K4me3Z[i] >= 1.64 || max_H3K27acZ[i] >= 1.64 || max_CTCFZ[i] >= 1.64)) {
	o << regionlist[i][0] << "\t" << regionlist[i][1] << "\t" << regionlist[i][2] << "\t"
	  << accession(i, 'E') << "\t" << max_DNaseZ[i] << "\t" << max_H3K4me3Z[i] << "\t"
	  << max_H3K27acZ[i] << "\t" << max_CTCFZ[i] << "\n";
	cREs.push_back(i);
      }
    }

    // write CTS
    std::cout << "found " << cREs.size() << " cREs\n";
    _write_cREs(dnase_list_, regionlist, DNaseZ, cREs);
    _write_cREs(h3k4me3_list_, regionlist, H3K4me3Z, cREs);
    _write_cREs(h3k27ac_list_, regionlist, H3K27acZ, cREs);
    _write_cREs(ctcf_list_, regionlist, CTCFZ, cREs);

  }
  */

  /**
     creates saturation curve; requires output from ENCODE::computeZScores
     output is saved to the saturation path defined in the Paths class
   */
  void ENCODE::make_saturation() {

    // load Z-scores into RegionSets
    std::vector<ScoredRegionSet> r(dnase_list_.size());
#pragma omp parallel for
    for (auto i = 0; i < dnase_list_.size(); ++i) {
      r[i].appendZ(path_.EncodeData(dnase_list_[i].exp, dnase_list_[i].acc, ".bigWig"));
    }

    // run saturation
    Saturation s(r);
    s.write(path_.saturation());

  }

} // SCREEN
