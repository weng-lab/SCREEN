#include <vector>
#include <iostream>
#include <string>
#include <unordered_map>
#include <fstream>
#include <sstream>
#include <cmath>
#include <numeric>
#include <memory>

#include <zi/zargs/zargs.hpp>
//ZiARG_bool(boolExample, false, "bool example");
ZiARG_int32(j, 1, "cores");
ZiARG_string(rootPath, "/data/projects/cREs/", "root path");

#include <boost/filesystem.hpp>
#include <boost/filesystem/operations.hpp>

#include "zentLib/src/BigWigWrapper.hpp"

#include "cpp/files.hpp"
#include "cpp/string_utils.hpp"

#include "common/region.hpp"
#include "common/utils.hpp"
#include "lookup_matrix.hpp"
#include "common/zscore.hpp"
#include "common/rDHS.hpp"
#include "paths.hpp"
#include "common/saturation.hpp"

namespace SCREEN {

  struct DataPaths {
    std::vector<bfs::path> ENCODE_DNase_bw;
    std::vector<bfs::path> ENCODE_DNase_np;
  };

  /*
   *  compute Z-scores for the given DHSs from the associated signal files
   *  returns the paths to the Z-scores; updates ENCODE_DNase_bw and ENCODE_DNase_bed to reflect the paths used for computation
   */
  DataPaths getZScores(const Paths& paths, bool force_recompute = false) {
    std::vector<bfs::path> ENCODE_DNase_bw;
    std::vector<bfs::path> ENCODE_DNase_bed;
    std::vector<bfs::path> ENCODE_DNase_np;
    std::vector<int> ENCODE_DNase_idx;
    std::vector<int> ENCODE_DNase_read;
    std::string line; int i = 0;

    const auto lines = bib::files::readStrings(paths.hotspot_list());
    for(const auto& line : lines){
      const auto cols = bib::string::split(line, '\t');

      ENCODE_DNase_bw.push_back(paths.EncodeData(cols[0], cols[3], ".bigWig"));
      ENCODE_DNase_bed.push_back(paths.EncodeData(cols[0], cols[1], ".bed.gz"));
      ENCODE_DNase_np.push_back(paths.DHS_ZScore(cols[3]));
      if (force_recompute || !bfs::exists(ENCODE_DNase_np[i])) {
	ENCODE_DNase_idx.push_back(i++);
      } else {
	ENCODE_DNase_read.push_back(i++);
      }
    }
    std::cout << "computing Z-scores for " << ENCODE_DNase_idx.size() << " exps\n";

#pragma omp parallel for
    for (auto n = 0; n < ENCODE_DNase_idx.size(); ++n) {
      int i = ENCODE_DNase_idx[n];
      ZScore z(ENCODE_DNase_bed[i], ENCODE_DNase_bw[i], false);
      z.qfilter(0.001);
      z.write(trim_ext(basename(ENCODE_DNase_bw[i])),
	      ENCODE_DNase_np[i]);
      std::cout << ENCODE_DNase_np[i] << "\t" << z.zscores_.size() << "\n";
    }

    return {ENCODE_DNase_bw, ENCODE_DNase_np};
  }

  void run_saturation(const std::string& assembly) {
    // compute DHS Z-scores per experiment
    Paths path(ZiARG_rootPath, assembly);
    const DataPaths d = getZScores(path);
    const auto& z = d.ENCODE_DNase_np;

    // load Z-scores into RegionSets
    std::vector<RegionSet> r(z.size());
    std::cout << "loading Z-scores for " << z.size() << " exps\n";

#pragma omp parallel for
    for (auto i = 0; i < z.size(); ++i) {
      r[i].appendZ(z[i]);
    }

    // run saturation
    std::cout << "running saturation...\n";
    Saturation s(r);
    s.write(path.saturation());
    std::cout << path.saturation() << "\n";

    // run saturation
    //  Saturation s(z);
    //  s.write(path.saturation());

  }

  /*
   *  compute rDHSs for an assembly; return the number of rDHSs
   */
  rDHS run_rDHS(const std::string& assembly) {

    std::vector<std::string> ENCODE_DNase_bw;
    std::vector<std::string> ENCODE_DNase_bed;

    // compute DHS Z-scores per experiment
    Paths path(ZiARG_rootPath, assembly);
    const DataPaths d = getZScores(path, false);
    const auto& z = d.ENCODE_DNase_np;
    const auto N = d.ENCODE_DNase_bw.size();

    // compute rDHSs
    std::cout << "computing rDHSs for " << z.size() << " exps\n";
    rDHS rr(z);
    rr.write(path.rDHS_list());
    return rr;

  }

  const std::vector<bfs::path> _readlist(const Paths& paths, const std::string& path) {
    std::ifstream f(path);
    std::string line;
    std::vector<bfs::path> ret;
    while (getline(f, line)) {
      std::vector<std::string> v = split(line, '\t');
      ret.push_back(paths.EncodeData(v[0], v[1], ".bigWig"));
    }
    return ret;
  }

  std::vector<float> _computeZ(const std::vector<bfs::path>& paths,
			       const std::vector<std::vector<std::string>>& regionlist,
			       std::vector<ZScore>& output_list) {
    // empty max-Z vector
    std::vector<float> maxZ(regionlist.size(), -10.0);
    std::cout << "computing Z-scores for " << paths.size() << " exps\n";
  
    // compute Z-scores
#pragma omp parallel for
    for (auto i = 0; i < paths.size(); ++i) {
      output_list[i] = ZScore(regionlist, paths[i], true);
      for (auto n = 0; n < regionlist.size(); ++n) {
	if (maxZ[n] < output_list[i].zscores_[n]) {
	  maxZ[n] = output_list[i].zscores_[n];
	}
      }
    }

    // return maxZ list
    return maxZ;
  }

  void _write_cREs(const std::vector<bfs::path>& outFiles,
		   const std::vector<std::vector<std::string>>& regionlist,
		   const std::vector<ZScore>& zscores, const std::vector<int> cREs,
		   const Paths& paths) {
    for (size_t i = 0; i < outFiles.size(); ++i) {
      const auto& outFile = outFiles[i];
      std::ofstream f(paths.CTS(outFile.stem().string()).string());
      for (auto n = 0; n < cREs.size(); ++n) {
	f << regionlist[cREs[n]][0] << "\t" << regionlist[cREs[n]][1]
	  << "\t" << regionlist[cREs[n]][2] << "\t"
	  << accession(cREs[n], 'E') << "\t"
	  << zscores[i].zscores_[cREs[n]] << "\n";
      }
    }
  }

  void create_cREs(rDHS rr, const std::string& dnase_list,
		   const std::string& h3k4me3_list, const std::string& h3k27ac_list,
		   const std::string& ctcf_list, const std::string& assembly) {
    // get paths for all the signal files
    Paths paths(ZiARG_rootPath, assembly);
    std::vector<bfs::path> dnase_paths = _readlist(paths, dnase_list);
    std::vector<bfs::path> h3k4me3_paths = _readlist(paths, h3k4me3_list);
    std::vector<bfs::path> h3k27ac_paths = _readlist(paths, h3k27ac_list);
    std::vector<bfs::path> ctcf_paths = _readlist(paths, ctcf_list);

    // empty vectors for holding Z-scores, cREs
    std::vector<ZScore> DNaseZ(dnase_paths.size());
    std::vector<ZScore> H3K4me3Z(h3k4me3_paths.size());
    std::vector<ZScore> H3K27acZ(h3k27ac_paths.size());
    std::vector<ZScore> CTCFZ(ctcf_paths.size());
    std::vector<int> cREs;

    // condense regions into vector, compute maxZ
    std::vector<std::vector<std::string>> regionlist = rr.regionlist();
    std::vector<float> max_DNaseZ = _computeZ(dnase_paths, regionlist, DNaseZ);
    std::vector<float> max_H3K4me3Z = _computeZ(h3k4me3_paths, regionlist, H3K4me3Z);
    std::vector<float> max_H3K27acZ = _computeZ(h3k27ac_paths, regionlist, H3K27acZ);
    std::vector<float> max_CTCFZ = _computeZ(ctcf_paths, regionlist, CTCFZ);

    // write CTA
    std::cout << "writing CTA cREs\n";
    std::ofstream f(paths.CTA().string());
    for (auto i = 0; i < max_DNaseZ.size(); ++i) {
      if (max_DNaseZ[i] >= 1.64 && (max_H3K4me3Z[i] >= 1.64 ||
				    max_H3K27acZ[i] >= 1.64 ||
				    max_CTCFZ[i] >= 1.64)) {
	f << regionlist[i][0] << "\t" << regionlist[i][1] << "\t" << regionlist[i][2] << "\t"
	  << accession(i, 'E') << "\t" << max_DNaseZ[i] << "\t" << max_H3K4me3Z[i] << "\t"
	  << max_H3K27acZ[i] << "\t" << max_CTCFZ[i] << "\n";
	cREs.push_back(i);
      }
    }

    // write CTS
    std::cout << "found " << cREs.size() << " cREs\n";
    _write_cREs(dnase_paths, regionlist, DNaseZ, cREs, paths);
    _write_cREs(h3k4me3_paths, regionlist, H3K4me3Z, cREs, paths);
    _write_cREs(h3k27ac_paths, regionlist, H3K27acZ, cREs, paths);
    _write_cREs(ctcf_paths, regionlist, CTCFZ, cREs, paths);

  }

  void run_cistrome_rDHS(const std::string& assembly, bool force_recompute = false) {
    Paths path(ZiARG_rootPath, assembly);

    // load list of files
    std::vector<bfs::path> cistrome_list;
    std::vector<bfs::path> cistrome_comp;

    const auto lines = bib::files::readStrings(path.cistromeList());
    std::vector<int> comp_idx;
    std::vector<int> read_idx;

    int i = 0;
    for(const auto& line : lines){
      cistrome_list.push_back(line);
      cistrome_comp.push_back(path.DHS_ZScore(trim_ext(basename(cistrome_list[i])), "cistrome").string());
      if (force_recompute || !bfs::exists(cistrome_comp[i])) {
	comp_idx.push_back(i++);
      } else {
	read_idx.push_back(i++);
      }
    }

#pragma omp parallel for
    for (auto n = 0; n < comp_idx.size(); ++n) {
      int i = comp_idx[n];
      ZScore z(cistrome_list[i], false);
      z.qfilter(0.001);
      z.write(trim_ext(basename(cistrome_list[i])),
	      cistrome_comp[i]);
      std::cout << cistrome_list[i] << "\t" << z.zscores_.size() << "\n";
    }

    // compute rDHSs
    std::cout << "computing rDHSs for " << cistrome_comp.size() << " exps\n";
    for (const auto& fnp : cistrome_comp) {
      std::cout << fnp << "\n";
    }
    rDHS rr(cistrome_comp);
  }

} // namespace SCREEN

/*
 *  test entry point
 */
int main(int argc, char **argv){
  zi::parse_arguments(argc, argv, true);  // modifies argc and argv

  // remaining arguments
  std::vector<std::string> args(argv, argv + argc);

  std::cout << "*** hg19 ***\n";
  SCREEN::create_cREs(SCREEN::run_rDHS("hg19"), "/data/projects/screen/Version-4/ver10/hg19/raw/dnase-list.txt",
		      "/data/projects/screen/Version-4/ver10/hg19/raw/h3k4me3-list.txt",
		      "/data/projects/screen/Version-4/ver10/hg19/raw/h3k27ac-list.txt",
		      "/data/projects/screen/Version-4/ver10/hg19/raw/ctcf-list.txt", "hg19");
  //run_saturation("hg19");

  std::cout << "\n*** mm10 ***\n";
  //SCREEN::run_rDHS("mm10");
  //SCREEN::run_cistrome_rDHS("mm10");

  return 0;
}
