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
ZiARG_string(chr, "", "chrom to load");
ZiARG_string(assembly, "", "assembly");
ZiARG_bool(first, false, "show first line");
ZiARG_bool(split, false, "split up files");
ZiARG_int32(j, 5, "num threads");

namespace bib {

  namespace a = arma;

  class Builder {
    const bfs::path base_;
    const std::string assembly_;
    bfs::path d_;

  private:
    void setGroupWrite(bfs::path fnp){
      bfs::permissions(fnp, bfs::add_perms | bfs::owner_write | bfs::group_write);
    }

  public:
    Builder(const bfs::path base, std::string assembly)
      : base_(base)
      , assembly_(assembly)
    {
      d_ = base / assembly / "raw";
    }

    void run(){
      HumanMousePaths hmp(assembly_, base)

    }
  };

  void run(bfs::path base, std::string assembly){
    std::cout << assembly << std::endl;
    base /= assembly;

    bib::Builder b(base, assembly, sfi);
    {
      bib::TicToc tt("build time");
      b.run();
    }
  }

} // namespace bib

int main(int argc, char* argv[]){
  zi::parse_arguments(argc, argv, true);  // modifies argc and argv
  const auto args = std::vector<std::string>(argv + 1, argv + argc);

  bfs::path base= "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4";
  base /= "ver9";

  std::vector<std::string> assemblies = {"hg19", "mm10"};
  if(ZiARG_assembly > ""){
    assemblies = {ZiARG_assembly};
  }

  for(const auto& assembly : assemblies){
    bib::run(base, assembly);
  }

  return 0;
}
