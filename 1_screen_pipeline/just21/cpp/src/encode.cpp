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
#include "common/rDHS.hpp"
#include "common/binarysignal.hpp"
#include "common/saturation.hpp"
#include "common/correlation.hpp"
#include "paths.hpp"
#include "cREs/ctcf_tad.hpp"
#include "encode.hpp"

namespace SCREEN {

  ENCODE::ENCODE(const bfs::path &root, const std::string &assembly) : path_(Paths(root, assembly)), assembly_(assembly) {
    _load_DHS_paths();
    _load_signallists();
    chrom_info_ = parseChromLengths(path_.chromInfo());
  }

  void ENCODE::runCorrelation() {

    RegionSet r;
    r.appendFile(path_.rDHS_list());
    
    BinarySignal b(path_.root() / "rDHS" / "signal");
    std::vector<bfs::path> dnase_paths;
    for (auto &file : dnase_list_) {
      dnase_paths.push_back(path_.EncodeData(file.exp, file.acc, ".bigWig"));
    }

    for (auto &kv : r.regions_.regions_) {
      std::cout << "running " << kv.first << "\n";
      a::Mat<float> c = SCREEN::runCorrelation(b, dnase_paths, kv.first, r);
      writeCorrelation(c, path_.correlation(kv.first));
    }
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

  void ENCODE::_binarize_list(const std::vector<ENCODEFile> &list, BinarySignal &b) {
#pragma omp parallel for num_threads(16)
    for (auto i = 0; i < list.size(); ++i) {
      if (!boost::filesystem::exists(b.outputdir_ / list[i].acc)) {
	b.convertSignal(path_.EncodeData(list[i].exp, list[i].acc, ".bigWig"));
      }
    }
  }

  void ENCODE::binarizeDHS() {
    RegionSet r;
    RegionFilter qfilter = QFilter(0.001);
    
    std::cout << "loading DHSs...\n";
    for (auto &peakfile : DHS_peaks_) {
      r.appendFile(path_.EncodeData(peakfile.exp, peakfile.acc, ".bed.gz"), qfilter);
    }
    r.regions_.unique();
    std::cout << "found " << r.regions_.total() << " unique DHSs\n";

    _binarize(r, "DHS");
  }

  void ENCODE::binarize_rDHS() {
    RegionSet r;
    r.appendFile(path_.rDHS_list());
    _binarize(r, "rDHS");
  }

  /**
      create binary signal files for all raw DHSs
  */
  void ENCODE::_binarize(RegionSet &r, const std::string &dir) {


    BinarySignal b(r, path_.root() / dir / "signal");
    std::cout << "completed writing regions\n";

    _binarize_list(DHS_signal_, b);
    _binarize_list(dnase_list_, b);
    _binarize_list(ctcf_list_, b);

    r.regions_.expandPeaks(500, chrom_info_);
    b = BinarySignal(r, path_.root() / dir / "signal+500");
    _binarize_list(h3k4me3_list_, b);
    _binarize_list(h3k27ac_list_, b);

    std::cout << "completed writing binary signal\n";
    
  }

  /**
     compute Z-scores for all the raw DHSs
     results are saved to the Z-score output directory defined in the Paths class
   */
  void ENCODE::computeZScores(bool force_recompute) {

    BinarySignal b(path_.root() / "DHS" / "signal");

#pragma omp parallel for
    for (auto i = 0; i < DHS_signal_.size(); ++i) {
      
      if (force_recompute || !bfs::exists(path_.DHS_ZScore(DHS_signal_[i].acc))) {

	// get DHS signal and compute Z-scores
	ScoredRegionSet r;
	RegionFilter qfilter = QFilter(DHS_FDR_THRESHOLD);
	r.appendNarrowPeak(path_.EncodeData(DHS_peaks_[i].exp, DHS_peaks_[i].acc, ".bed.gz"), qfilter);
	ChrToRegions<int> idx = b.findIndices(r);
	ScoredRegionSet ZScores = b.readSignal(path_.EncodeData(DHS_signal_[i].exp, DHS_signal_[i].acc, ".bigWig"), r, idx);
	ZScores.convertToZ();

	// write regions with unique IDs
	int n = 0;
	std::ofstream f(path_.DHS_ZScore(DHS_signal_[i].acc).string());
	for (auto &kv : ZScores.regions_.regions_) {
	  for (auto &region : kv.second) {
	    f << kv.first << '\t' << region.start << '\t' << region.end << '\t'
	      << DHS_signal_[i].acc << '_' << (n++) << '\t' << region.score << '\n';
	  }
	}
	std::cout << DHS_signal_[i].acc << "\t" << ZScores.regions_.total() << "\n";

      }

    }

  }

  /**
     computes rDHSs; requires Z-score output from ENCODE::computeZScores
     saves results to the rDHS path defined in the Paths class
   */
  void ENCODE::make_rDHS(bool force_recompute) {
    
    if (bfs::exists(path_.rDHS_list()) && !force_recompute) {
      load_rDHS();
      return;
    }

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
     loads rDHSs from disk; must be saved to rDHS_list path from the paths object
   */
  void ENCODE::load_rDHS() {
    rDHS_ = rDHS(path_.rDHS_list());
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
  
  std::vector<ScoredRegionSet> ENCODE::_computeMaxZ(std::vector<ENCODEFile> &signallist, ScoredRegionSet &output, const std::string &subdir) {
    
    BinarySignal b(path_.root() / "rDHS" / subdir);

    ChrToRegions<int> r = b.findIndices(output);
    for (auto i = 0; i < 100; ++i) {
      std::cout << b.regions_.regions_["chr1"][i] << '\t' << output.regions_.regions_["chr1"][i] << '\t' << r["chr1"][i] << '\n';
    }

    std::vector<ScoredRegionSet> ZScoreList(signallist.size());

#pragma omp parallel for num_threads(16) // read signal; high I/O; restrict to 16
    for (auto i = 0; i < signallist.size(); ++i) {
      const auto &signalfile = signallist[i];
      ZScoreList[i] = b.readSignal(path_.EncodeData(signalfile.exp, signalfile.acc, ".bigWig"), output, r);
    }

#pragma omp parallel for // high compute; no thread restriction
    for (auto i = 0; i < signallist.size(); ++i) {
      ZScoreList[i].convertToZ(true);
    }

#pragma omp parallel for num_threads(16) // write signal; high I/O; restrict to 16
    for (auto i = 0; i < signallist.size(); ++i) {
      const auto &signalfile = signallist[i];
      ZScoreList[i].regions_.write(path_.CTS(signalfile.acc));
      std::cout << "wrote " << path_.CTS(signalfile.acc) << " (" << (i + 1) << '/' << signallist.size() << ")\n";
    }

    for (auto j = 0; j < signallist.size(); ++j) {
      for (auto &kv : output.regions_.regions_) {
#pragma omp parallel for // high compute; no thread restriction
	for (auto i = 0; i < kv.second.size(); ++i) {
	  if (ZScoreList[j].regions_.regions_[kv.first][i].score > kv.second[i].score) {
	    output.regions_.regions_[kv.first][i] = {
	      ZScoreList[j].regions_.regions_[kv.first][i].start,
	      ZScoreList[j].regions_.regions_[kv.first][i].end,
	      ZScoreList[j].regions_.regions_[kv.first][i].score
	    };
	  }
	}
      }
    }

    return ZScoreList;

  }

  /**
     create cREs; requires output from ENCODE::make_rDHS
     output is saved to the CTA and CTS paths defined in the Paths class
   */
  void ENCODE::create_cREs() {
    
    // empty sets for holding Z-scores, cREs
    std::cout << "creating scored region sets...\n";
    ScoredRegionSet DNaseZ(rDHS_.regions_, -10.0), H3K4me3Z(rDHS_.regions_, -10.0),
      H3K27acZ(rDHS_.regions_, -10.0), CTCFZ(rDHS_.regions_, -10.0);

    // expand window by 500 bp then compute histone Z-scores
    H3K27acZ.regions_.expandPeaks(500, chrom_info_);
    H3K4me3Z.regions_.expandPeaks(500, chrom_info_);
    _computeMaxZ(h3k4me3_list_, H3K4me3Z, "signal+500");
    _computeMaxZ(h3k27ac_list_, H3K27acZ, "signal+500");

    // compute maxZ for DNase and CTCF
    _computeMaxZ(dnase_list_, DNaseZ, "signal");
    _computeMaxZ(ctcf_list_, CTCFZ, "signal");

    // filter cREs
    uint64_t n = 0;
    std::ofstream CTA(path_.CTA().string());
    for (auto &kv : DNaseZ.regions_.regions_) {
      for (auto i = 0; i < kv.second.size(); ++i) {
	if (kv.second[i].score >= 1.64 && (H3K4me3Z.regions_.regions_[kv.first][i].score >= 1.64
					   || CTCFZ.regions_.regions_[kv.first][i].score >= 1.64
					   || H3K27acZ.regions_.regions_[kv.first][i].score >= 1.64)) {
	  CTA << kv.first << '\t' << kv.second[i].start << '\t' << kv.second[i].end << '\t' << accession(n, 'E') << '\t'
	      << kv.second[i].score << '\t' << H3K4me3Z.regions_.regions_[kv.first][i].score << '\t'
	      << H3K27acZ.regions_.regions_[kv.first][i].score << '\t' << CTCFZ.regions_.regions_[kv.first][i].score << '\n';
	}
	++n;
      }
    }
    std::cout << "wrote " << n << " cREs to " << path_.CTA().string() << "\n";

  }

  void ENCODE::similar_DNase_jaccard() {

    // get max and CTS Z-scores
    std::cout << "computing Z-scores...\n";
    ScoredRegionSet maxZ(rDHS_.regions_, -10.0);
    std::vector<ScoredRegionSet> dnase_Z = _computeMaxZ(dnase_list_, maxZ, "signal");
    
    // for each rDHS...
    for (auto &kv : maxZ.regions_.regions_) {

      for (auto i = 0; i < kv.second.size(); ++i) {

	ChrToRegions<float> results;

	// find active cell types
	std::cout << "finding active cell types...\n";
	std::vector<char> active(dnase_Z.size(), 0);
	for (auto j = 0; j < dnase_Z.size(); ++j) {
	  if (dnase_Z[j].regions_.regions_[kv.first][i].score > 1.64) { active[j] = 1; }
	}

	// get jaccard index for all other regions
	std::cout << "finding jaccard...\n";
	int l = 0;
	for (auto &kv : maxZ.regions_.regions_) {
	  for (auto k = 0; k < kv.second.size(); ++k) {
	    if (l++ % 100000 == 0) { std::cout << l << '\n'; }
	    float jaccard = 0.0;
	    for (auto j = 0; j < dnase_Z.size(); ++j) {
	      jaccard += (float)(!(active[j] ^ (dnase_Z[j].regions_.regions_[kv.first][k].score > 1.64)));
	    }
	    results[kv.first].push_back(jaccard / dnase_Z.size());
	  }
	}

	// write results
	std::cout << "writing " << path_.similarity("DNase", accession(i, 'D')).string() << '\n';
	std::ofstream f(path_.similarity("DNase", accession(i, 'D')).string());
	for (auto &kv : results) {
	  for (auto i = 0; i < kv.second.size(); ++i) {
	    f << kv.first << '\t' << maxZ.regions_.regions_[kv.first][i].start << '\t' << maxZ.regions_.regions_[kv.first][i].end << '\t'
	      << kv.second[i] << '\n';
	  }
	}

	break;

      }

    }

  }

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

  void ENCODE::compute_density(const std::string &assayname, const std::vector<ENCODEFile> &list,
			       uint32_t binsize) {
    std::vector<bfs::path> cRE_paths;
    for (const auto &file : list) {
      cRE_paths.push_back(path_.CTS(file.acc));
    }
    CTCF_TAD(cRE_paths).write(path_.density(assayname, binsize), binsize);
  }

} // SCREEN
