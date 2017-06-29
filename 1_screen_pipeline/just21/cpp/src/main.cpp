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

#include "common/region.hpp"
#include "utils.hpp"
#include "lookup_matrix.hpp"
#include "zscore.hpp"
#include "rDHS.hpp"
#include "paths.hpp"
#include "saturation.hpp"

/*
 *  compute Z-scores for the given DHSs from the associated signal files
 *  returns the paths to the Z-scores; updates ENCODE_DNase_bw and ENCODE_DNase_bed to reflect the paths used for computation
 */
std::vector<std::string> getZScores(const SCREEN::Paths &path, bool force_recompute = false) {

  std::vector<std::string> ENCODE_DNase_bw, ENCODE_DNase_bed;
  std::vector<std::string> ENCODE_DNase_np;
  std::vector<int> ENCODE_DNase_idx;
  std::vector<int> ENCODE_DNase_read;
  std::string line; int i = 0;

  std::ifstream in(path.hotspot_list().string());
  while (getline(in, line)) {
    std::vector<std::string> cols(SCREEN::split(line, '\t'));
    ENCODE_DNase_bw.push_back("/data/projects/encode/data/" + cols[0] + "/" + cols[3] + ".bigWig");
    ENCODE_DNase_bed.push_back("/data/projects/encode/data/" + cols[0] + "/" + cols[1] + ".bed.gz");
    ENCODE_DNase_np.push_back(path.DHS_ZScore(cols[3]).string());
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
    SCREEN::ZScore z(ENCODE_DNase_bed[i], ENCODE_DNase_bw[i], false);
    z.qfilter(0.001);
    z.write(SCREEN::trim_ext(SCREEN::basename(ENCODE_DNase_bw[i])), ENCODE_DNase_np[i]);
    std::cout << ENCODE_DNase_np[i] << "\t" << z.zscores.size() << "\n";
  }

  return ENCODE_DNase_np;

}

void run_saturation(const std::string &assembly) {
  
  std::vector<std::string> ENCODE_DNase_bw;
  std::vector<std::string> ENCODE_DNase_bed;

  // compute DHS Z-scores per experiment
  SCREEN::Paths path("/data/projects/cREs/" + assembly);
  std::vector<std::string> z = getZScores(path);
  
  // load Z-scores into RegionSets
  std::vector<SCREEN::RegionSet> r(z.size());
  std::cout << "loading Z-scores for " << z.size() << " exps\n";

#pragma omp parallel for
  for (auto i = 0; i < z.size(); ++i) {
    r[i].appendZ(z[i]);
  }
  
  // run saturation
  std::cout << "running saturation...\n";
  SCREEN::Saturation s(r);
  s.write(path.saturation());
  std::cout << path.saturation() << "\n";

  // run saturation
  //  SCREEN::Saturation s(z);
  //  s.write(path.saturation());

}

/*
 *  compute rDHSs for an assembly; return the number of rDHSs
 */
void run_rDHS(const std::string &assembly) {

  std::vector<std::string> ENCODE_DNase_bw;
  std::vector<std::string> ENCODE_DNase_bed;

  // compute DHS Z-scores per experiment
  SCREEN::Paths path("/data/projects/cREs/" + assembly);
  std::vector<std::string> z = getZScores(path, false);

  // compute rDHSs
  std::cout << "computing rDHSs for " << z.size() << " exps\n";
  SCREEN::rDHS rr(z); //bfs::path("/home/pratth/test.dat"));

}

void run_cistrome_rDHS(const std::string &assembly, bool force_recompute = false) {

  // load list of files
  std::vector<std::string> cistrome_list, cistrome_comp;
  std::ifstream f("/data/projects/cREs/mm10/cistrome_list.txt");
  std::string line;
  std::vector<int> comp_idx, read_idx;
  SCREEN::Paths path("/data/projects/cREs/" + assembly);
  int i = 0;
  while (std::getline(f, line)) {
    cistrome_list.push_back(line);
    cistrome_comp.push_back(path.DHS_ZScore(SCREEN::trim_ext(SCREEN::basename(cistrome_list[i])), "cistrome").string());
    if (force_recompute || !bfs::exists(cistrome_comp[i])) {
      comp_idx.push_back(i++);
    } else {
      read_idx.push_back(i++);
    }
  }

  #pragma omp parallel for
  for (auto n = 0; n < comp_idx.size(); ++n) {
    int i = comp_idx[n];
    SCREEN::ZScore z(cistrome_list[i], false);
    z.qfilter(0.001);
    z.write(SCREEN::trim_ext(SCREEN::basename(cistrome_list[i])),
	    cistrome_comp[i]);
    std::cout << cistrome_list[i] << "\t" << z.zscores.size() << "\n";
  }

  // compute rDHSs
  std::cout << "computing rDHSs for " << cistrome_comp.size() << " exps\n";
  for (std::string &path : cistrome_comp) {
    std::cout << path << "\n";
  }
  SCREEN::rDHS rr(cistrome_comp);

}

/*
 *  test entry point
 */
int main(int argc, char **argv)
{

  std::cout << "*** hg19 ***\n";
  //run_rDHS("hg19");
  run_saturation("hg19");

  std::cout << "\n*** mm10 ***\n";
  //run_rDHS("mm10");
  //run_cistrome_rDHS("mm10");

  return 0;
}
