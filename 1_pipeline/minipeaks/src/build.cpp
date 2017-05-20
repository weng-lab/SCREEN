#define ARMA_64BIT_WORD
#include <armadillo>

#define likely(x) __builtin_expect ((x), 1)
#define unlikely(x) __builtin_expect ((x), 0)

#include <atomic>
#include <iomanip>
#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <algorithm>
#include <mutex>

#include <json/json.h>
#include <json/reader.h>
#include <boost/optional.hpp>
#include <boost/filesystem.hpp>
#include <boost/log/trivial.hpp>
#include <boost/log/utility/setup.hpp>

#include <zi/concurrency/concurrency.hpp>
#include <zi/parallel/algorithm.hpp>
#include <zi/parallel/numeric.hpp>

#include "cpp/utility.hpp"
#include "cpp/string_utils.hpp"
#include "cpp/files.hpp"
#include "cpp/gzip_reader.hpp"
#include "cpp/tictoc.hpp"

#include <zi/zargs/zargs.hpp>

namespace bib {

  namespace a = arma;

  template <typename S, typename C>
  S& join(S& s, const C& vec, const std::string delim){
    // http://stackoverflow.com/a/2519016
    for(auto it = vec.begin(); it != vec.end(); ++it ){
      if( it != vec.begin() ){
	s << delim;
      }
      s << *it;
    }
    return s;
  }

  int bwtool(){
    std::string line;

    std::stringstream s;
    while(std::getline(std::cin, line)){
      const auto toks = bib::str::split(line, '\t');
      //const std::string& accession = toks[3];
      const auto vals = bib::str::split(toks[5], ',');

      static const size_t n_bars = 30;

      a::fvec regions(vals.size());
      for(size_t i = 0; i < vals.size(); ++i){
          if(likely(vals[i] != "NA")){
              regions[i] = std::stof(vals[i]);
          } else{
              regions[i] = 0;
          }
      }

      size_t chunkSize = regions.size() / n_bars;
      std::vector<float> ret;
      for(size_t i = 0; i < n_bars; ++i){
          float sum = 0;
          for(size_t j = chunkSize * i;
              j < chunkSize * (i + 1) && j < regions.size(); ++j){
              sum += regions[j];
          }
          sum /= chunkSize;
          ret.push_back(sum);
      }

      s << std::setprecision(4);
      s << "\"[ "; join(s, ret, ",") << "]\"\n";
    }

    std::cout << s.str();

    return 0;
  }

} // namespace bib

int main(int argc, char* argv[]){
  zi::parse_arguments(argc, argv, true);  // modifies argc and argv
  const auto args = std::vector<std::string>(argv + 1, argv + argc);

  return bib::bwtool();

  return 0;
}
