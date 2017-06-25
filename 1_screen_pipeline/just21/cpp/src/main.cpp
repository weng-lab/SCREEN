#include <vector>
#include <iostream>
#include <string>
#include <unordered_map>
#include <fstream>
#include <sstream>
#include <cmath>
#include <numeric>

#include <boost/filesystem.hpp>
#include <boost/filesystem/operations.hpp>
#include <boost/filesystem/path.hpp>

#include "../../common/zentLib/src/BigWigWrapper.hpp"

#include "utils.hpp"
#include "lookup_matrix.hpp"
#include "zscore.hpp"
#include "rDHS.hpp"
#include "paths.hpp"

std::vector<std::string> getZScores(const SCREEN::Paths &path, bool force_recompute = false) {

  std::vector<std::string> ENCODE_DNase_bw;
  std::vector<std::string> ENCODE_DNase_bed;
  std::vector<int> ENCODE_DNase_idx;
  std::vector<std::string> ENCODE_DNase_np;
  std::string line; int i = 0;

  size_t total_DHSs = 0, filtered_DHSs = 0;

  std::ifstream in(path.hotspot_list().string());
  while (getline(in, line) && ++i) {
    std::vector<std::string> cols(SCREEN::split(line, '\t'));
    ENCODE_DNase_bw.push_back("/data/projects/encode/data/" + cols[0] + "/" + cols[3] + ".bigWig");
    ENCODE_DNase_bed.push_back("/data/projects/encode/data/" + cols[0] + "/" + cols[1] + ".bed.gz");
    ENCODE_DNase_np.push_back(path.DHS_ZScore(cols[3]).string());
    if (force_recompute || !boost::filesystem::exists(path.DHS_ZScore(cols[3]))) {
      ENCODE_DNase_idx.push_back(i);
    }
  }
  std::cout << "computing Z-scores for " << ENCODE_DNase_idx.size() << " exps\n";

#pragma omp parallel for
  for (auto i = 0; i < ENCODE_DNase_idx.size(); ++i) {
    SCREEN::ZScore z(ENCODE_DNase_bed[i], ENCODE_DNase_bw[i], false);
    total_DHSs += z.zscores.size();
    z.qfilter(0.001);
    filtered_DHSs += z.zscores.size();
    std::string fn = SCREEN::trim_ext(SCREEN::basename(ENCODE_DNase_bw[i]));
    z.write(fn, path.DHS_ZScore(fn));
  }

  std::cout << "total DHSs: " << total_DHSs << "\n";
  std::cout << "filtered DHSs: " << filtered_DHSs << "\n";

  return ENCODE_DNase_np;

}

void run(const std::string &assembly) {
  SCREEN::Paths path("/data/projects/cREs/" + assembly);
  std::vector<std::string> ENCODE_DNase_np = getZScores(path, true);
  std::cout << "computing rDHSs for " << ENCODE_DNase_np.size() << " exps\n";
  SCREEN::rDHS rr(ENCODE_DNase_np, path.rDHS_list());
}

/*
 *  test entry point
 */
int main(int argc, char **argv)
{

  /*
  test_lookupmatrix();
  test_zscore();
  test_rdhs();
  */

  std::cout << "*** hg19 ***\n";
  run("hg19");
  std::cout << "\n*** mm10 *** \n";
  run("mm10");

  return 0;
}
