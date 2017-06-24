#include <vector>
#include <iostream>
#include <string>
#include <unordered_map>
#include <fstream>
#include <sstream>
#include <cmath>
#include <numeric>

#include <boost/filesystem/operations.hpp>
#include <boost/filesystem/path.hpp>

#include "../../common/zentLib/src/BigWigWrapper.hpp"

#include "utils.hpp"
#include "lookup_matrix.hpp"
#include "zscore.hpp"
#include "rDHS.hpp"

/*
 *  example usage of the lookup matrix
 */
void test_lookupmatrix() {

  std::cout << "--- test lookup matrix ---\n";
  
  // load mm10 matrix
  SCREEN::LookupMatrix l("/data/projects/screen/Version-4/ver10/mm10/mm10-Look-Up-Matrix.txt");

  // friendly name and DNase accession for WW6
  std::cout << l["WW6"]["name"] << "\n";
  std::cout << l["WW6"]["DNase"] << "\n";

  // friendly name for the first two biosamples
  // with all four assays
  std::cout << l.AllFour_[0]["name"] << "\n";
  std::cout << l.AllFour_[1]["name"] << "\n";
  std::cout << "--- /test lookup matrix ---\n\n";
  
}

/*
 *  example usage of Z-score computation
 */
void test_zscore() {

  std::cout << "--- test Z-score computation ---\n";
  
  // create Z-scores from a narrowPeak (top) and a bed plus signal bigWig (bottom)
  SCREEN::ZScore r("/data/projects/cistrome/data/raw/dnase_human/1798_sort_peaks.narrowPeak.bed");
  SCREEN::ZScore t("/data/projects/encode/data/ENCSR000BJC/ENCFF001TUZ.bed.gz", "/data/projects/encode/data/ENCSR000BJC/ENCFF155EOT.bigWig");

  // print a peak and associated Z-score from both
  // the peak is the original line from the bed with the Z-score in the signal column
  std::cout << r.lines[0][0] << "\t" << r.lines[0][1] << "\t" << r.lines[0][2] << "\t" << r.zscores[0] << "\n";
  std::cout << t.lines[0][0] << "\t" << t.lines[0][1] << "\t" << t.lines[0][2] << "\t" << t.zscores[0] << "\n";
  std::cout << "--- /test Z-score computation ---\n\n";
  
}

/*
 *  example usage of rDHS computation
 */
void test_rdhs() {

  std::cout << "--- test rDHS ---\n";
  
  // compute rDHSs from two narrowPeak files; save to /tmp/test_rdhs.bed
  std::vector<std::string> nplist {
    "/data/projects/cistrome/data/raw/dnase_human/1798_sort_peaks.narrowPeak.bed",
    "/data/projects/cistrome/data/raw/dnase_human/1799_sort_peaks.narrowPeak.bed"
  };
  SCREEN::rDHS rr(nplist, "/tmp/test_rDHS.bed");

  // output the first rDHS
  std::cout << rr[0] << "\n";
  std::cout << "--- /test rDHS ---\n";
  
}

std::vector<std::string> getZScores(std::string hotspot_list, bool skip_compute = false) {

  std::vector<std::string> ENCODE_DNase_bw;
  std::vector<std::string> ENCODE_DNase_bed;
  std::vector<std::string> ENCODE_DNase_np;
  std::string line;

  std::ifstream in(hotspot_list);
  while (getline(in, line)) {
    std::vector<std::string> cols(SCREEN::split(line, '\t'));
    ENCODE_DNase_bw.push_back("/data/projects/encode/data/" + cols[0] + "/" + cols[3] + ".bigWig");
    ENCODE_DNase_bed.push_back("/data/projects/encode/data/" + cols[0] + "/" + cols[1] + ".bed.gz");
  }
  std::cout << "computing Z-scores for " << ENCODE_DNase_bw.size() << " exps\n";

#pragma omp parallel for
  for (auto i = 0; i < ENCODE_DNase_bw.size(); ++i) {
    std::string f = "/data/projects/cREs/DNase/" + SCREEN::trim_ext(SCREEN::basename(ENCODE_DNase_bed[i])) + ".zscores.bed";
    SCREEN::ZScore z(ENCODE_DNase_bed[i], ENCODE_DNase_bw[i]);
    z.qfilter(0.001);
    z.write(SCREEN::trim_ext(SCREEN::basename(ENCODE_DNase_bed[i])), f);
    ENCODE_DNase_np.push_back(f);
  }

  return ENCODE_DNase_np;

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

  std::vector<std::string> ENCODE_DNase_np(getZScores("/data/projects/cREs/hg19-Hotspot-List.txt", true));
  std::cout << "computing rDHSs for " << ENCODE_DNase_np.size() << " exps\n";
  SCREEN::rDHS rr(ENCODE_DNase_np, "/data/projects/cREs/hg19-rDHS.bed");

  return 0;
}
