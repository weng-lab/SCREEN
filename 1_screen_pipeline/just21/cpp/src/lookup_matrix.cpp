#include <vector>
#include <string>
#include <unordered_map>
#include <fstream>
#include <sstream>
#include <iterator>

#include "utils.hpp"
#include "lookup_matrix.hpp"

namespace SCREEN {

  bool LookupMatrix::biosample_has(const std::string &biosample, const std::string &assay) {
    return 0 != matrix_[biosample][assay].compare("NA");
  }

  bool LookupMatrix::biosample_has_all(const std::string &biosample) {
    return biosample_has(biosample, "DNase") && biosample_has(biosample, "H3K4me3")
      && biosample_has(biosample, "H3K27ac") && biosample_has(biosample, "CTCF");
  }
  
  LookupMatrix::LookupMatrix(const std::string &path) {

    std::ifstream input(path);

    // for each line in file...
    for (std::string row; std::getline(input, row, '\n');) {
      // key is first col; create map
      std::vector<std::string> cols(split(row, '\t'));
      matrix_[cols[0]] = matrix_entry({
	  {"name", cols[1]},
	  {"DNase", cols[2]},
	  {"H3K4me3", cols[3]},
	  {"H3K27ac", cols[4]},
	  {"CTCF", cols[5]}
      });
    }

    // get lists by assay
    for (auto & e : matrix_){
      if (biosample_has_all(e.first)) { AllFour_.push_back(e.second); }
      if (biosample_has(e.first, "DNase")) { AllDNase_.push_back(e.second); }
      if (biosample_has(e.first, "H3K4me3")) { AllH3K4me3_.push_back(e.second); }
      if (biosample_has(e.first, "H3K27ac")) { AllH3K27ac_.push_back(e.second); }
      if (biosample_has(e.first, "CTCF")) { AllCTCF_.push_back(e.second); }
    }
  }

  matrix_entry &LookupMatrix::operator [](const std::string &index) {
    return matrix_[index];
  }
  
} // SCREEN
