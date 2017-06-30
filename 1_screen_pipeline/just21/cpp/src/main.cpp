#include <vector>
#include <iostream>
#include <string>
#include <unordered_map>
#include <fstream>
#include <sstream>
#include <cmath>
#include <numeric>
#include <memory>

#include <boost/filesystem.hpp>
#include <boost/filesystem/operations.hpp>

#include "zentLib/src/BigWigWrapper.hpp"

#include "cpp/files.hpp"
#include "cpp/string_utils.hpp"

#include "common/region.hpp"
#include "utils.hpp"
#include "lookup_matrix.hpp"
#include "zscore.hpp"
#include "rDHS.hpp"
#include "paths.hpp"
#include "saturation.hpp"

namespace SCREEN {

  struct DataPaths {
    std::vector<bfs::path> ENCODE_DNase_bw;
    std::vector<bfs::path> ENCODE_DNase_np;
  };
  
/*
 *  compute Z-scores for the given DHSs from the associated signal files
 *  returns the paths to the Z-scores; updates ENCODE_DNase_bw and ENCODE_DNase_bed to reflect the paths used for computation
 */
DataPaths getZScores(const Paths &paths, bool force_recompute = false) {
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

void run_saturation(const std::string &assembly) {
  // compute DHS Z-scores per experiment
  Paths path("/data/projects/cREs/" + assembly);
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
void run_rDHS(const std::string &assembly) {
  // compute DHS Z-scores per experiment
  Paths path("/data/projects/cREs/" + assembly);
  const DataPaths d = getZScores(path, false);
  const auto& z = d.ENCODE_DNase_np;
  const auto N = d.ENCODE_DNase_bw.size();

  // compute rDHSs
  std::cout << "computing rDHSs for " << z.size() << " exps\n";
  rDHS rr(z);
  rr.write(path.rDHS_list());

  // compute Z-scores
  std::vector<float> maxZ(rr.total(), -10.0);
  std::vector<std::vector<std::string>> regionlist = rr.regionlist();
  std::vector<int> cREs;
  std::vector<ZScore> rz(N);
  
  std::cout << "computing Z-scores for " << N << " exps\n";
#pragma omp parallel for
  for (auto i = 0; i < N; ++i) {
    rz[i] = ZScore(regionlist, d.ENCODE_DNase_bw[i], true);
    for (auto n = 0; n < maxZ.size(); ++n) {
      if (maxZ[n] < rz[i].zscores_[n]) {
	maxZ[n] = rz[i].zscores_[n];
      }
    }
  }

  // write CTA
  std::cout << "writing CTA cREs\n";
  std::ofstream o(path.CTA().string());
  for (auto i = 0; i < maxZ.size(); ++i) {
    if (maxZ[i] >= 1.64) {
      o << regionlist[i][0] << "\t" << regionlist[i][1] << "\t" << regionlist[i][2] << "\t"
	<< accession(i, 'E') << "\t" << maxZ[i] << "\n";
      cREs.push_back(i);
    }
  }

  // write CTS
  std::cout << "found " << cREs.size() << " cREs\n";
  std::cout << "writing CTS cREs for " << N << " exps\n";
#pragma omp parallel for  
  for (auto i = 0; i < N; ++i) {
    std::ofstream o(path.CTS(trim_ext(basename(d.ENCODE_DNase_bw[i]))).string());
    for (auto n = 0; n < cREs.size(); ++n) {
      o << regionlist[cREs[n]][0] << "\t" << regionlist[cREs[n]][1] << "\t" << regionlist[cREs[n]][2] << "\t"
	<< accession(cREs[n], 'E') << "\t" << rz[i].zscores_[cREs[n]] << "\n";
    }
  }
}

void run_cistrome_rDHS(const std::string &assembly, bool force_recompute = false) {
  Paths path("/data/projects/cREs/" + assembly);
  
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
int main(int argc, char **argv)
{

  std::cout << "*** hg19 ***\n";
  SCREEN::run_rDHS("hg19");
  //SCREEN::run_saturation("hg19");

  std::cout << "\n*** mm10 ***\n";
  //SCREEN::run_rDHS("mm10");
  //SCREEN::run_cistrome_rDHS("mm10");

  return 0;
}
