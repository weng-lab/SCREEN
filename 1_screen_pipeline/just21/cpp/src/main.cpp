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

#include "common/utils.hpp"
#include "common/lambda.hpp"
#include "common/region.hpp"
#include "lookup_matrix.hpp"
#include "common/zscore.hpp"
#include "common/rDHS.hpp"
#include "paths.hpp"
#include "common/saturation.hpp"

#include "encode.hpp"

namespace SCREEN {

  /* void run_cistrome_rDHS(const std::string &assembly, bool force_recompute = false) {

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
  } */

} // namespace SCREEN

/*
 *  test entry point
 */
int main(int argc, char **argv){

  zi::parse_arguments(argc, argv, true);  // modifies argc and argv
  std::vector<std::string> args(argv, argv + argc); // remaining arguments

  // create ENCODE hg19 cREs
  std::cout << "*** ENCODE hg19 ***\n";
  SCREEN::ENCODE e(ZiARG_rootPath, "hg19");

  std::cout << "making binary signal files\n";
  e.binarizeDHS();

  /*
  std::cout << "computing Z-scores...\n";
  e.computeZScores();
  std::cout << "creating rDHSs...\n";
  e.make_rDHS();
  std::cout << "creating cREs...\n";
  e.create_cREs();
  */

  //run_saturation("hg19");

  std::cout << "\n*** ENCODE mm10 ***\n";
  //SCREEN::run_rDHS("mm10");
  //SCREEN::run_cistrome_rDHS("mm10");

  return 0;
}
