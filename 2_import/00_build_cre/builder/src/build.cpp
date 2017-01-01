#include <boost/filesystem.hpp>
#include <boost/log/trivial.hpp>
#include <boost/log/utility/setup.hpp>
#include <mutex>

#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <algorithm>
#include <json/json.h>
#include <json/reader.h>
#include <array>
#include <zi/concurrency/concurrency.hpp>
#include <zi/system.hpp>

#include "cpp/utility.hpp"
#include "cpp/files.hpp"
#include "cpp/gzip_reader.hpp"
#include "cpp/tictoc.hpp"
#include "cpp/gzstream.hpp"

#include <zi/zargs/zargs.hpp>
ZiARG_string(file, "", "file to load");
ZiARG_bool(first, false, "show first line");
ZiARG_int32(j, zi::system::cpu_count, "num threads");

namespace bib {

  namespace bfs = boost::filesystem;

  class MousePaths {
  public:
    const std::string chr_;
    const bfs::path base_ = "/home/purcarom/0_metadata/encyclopedia/Version-4/ver8/mm10/raw";
    bfs::path path_;

    MousePaths(std::string chr)
      : chr_("chr" + chr)
    {
      path_ = base_ / chr_;
    }

    bfs::path allGenes(){
      return path_ / (chr_ + "_AllGenes");
    }
    bfs::path pcGenes(){
      return path_ / (chr_ + "_PCGenes");
    }
    bfs::path peaks(){
      return path_ / (chr_ + "_sorted-peaks");
    }
    bfs::path signalDir(){
      return path_ / "signal";
    }
  };

  template <typename T>
  class GetData {
    T paths_;

  public:
    GetData(T paths)
      : paths_(paths)
    {}

    // chrY    808996  809318  MP-2173311-100.000000   EE0756098
    struct Peak {
      std::string chrom;
      std::string start;
      std::string end;
      std::string mpID;
      std::string negLogP;
      std::string accession;
    };
    std::vector<Peak> peaks(){
      auto lines = bib::files::readStrings(paths_.peaks());

      std::vector<Peak> ret;
      for(const auto& p : lines){
	auto toks = bib::str::split(p, '\t');
	auto mpToks = bib::str::split(toks[3], '-');
	ret.emplace_back(Peak{toks[0], toks[1], toks[2],
	      mpToks[1], mpToks[2], toks[4]});
      }
      std::cout << "loaded " << ret.size() << " peaks\n";
      return ret;
    }

    struct Gene {
      std::string name;
      std::string distance;
    };
    using AccessionToGenes = std::unordered_map<std::string, std::vector<Gene>>;

    // 0    1      2      3                   4    5      6      7                     8 9 10
    // chrY,141692,141850,MP-2173235-3.088310,chrY,206151,207788,ENSMUSG00000101796.1 ,.,+,64302
    AccessionToGenes allGenes(){
      return loadGenes(paths_.allGenes(), "all");
    }

    AccessionToGenes pcGenes(){
      return loadGenes(paths_.pcGenes(), "pc");
    }

    AccessionToGenes loadGenes(bfs::path fnp, std::string typ){
      auto lines = bib::files::readStrings(fnp);

      uint32_t count{0};
      AccessionToGenes ret;
      for(const auto& g : lines){
	auto toks = bib::str::split(g, '\t');
	auto mpToks = bib::str::split(toks[3], '-');
	std::string accession = mpToks[1];
	ret[accession].emplace_back(Gene{toks[7], toks[10]});
	++count;
      }
      std::cout << "loaded " << count << " " << typ << " genes\n";
      return ret;
    }

    struct SignalLine {
      std::string name;
      float zscore;
      float signal;
      uint32_t rank;
    };

    struct SignalFile {
      bfs::path fnp;
      std::vector<SignalLine> lines;
    };

    std::vector<SignalFile> loadSignals(){
      bfs::path dir = paths_.signalDir();
      std::vector<SignalFile> ret;
      
      for(const auto& fnp : bib::files::dir(dir)){
	std::cout << fnp << std::endl;
	auto lines = bib::files::readStrings(fnp);
	SignalFile sf;
	sf.fnp = fnp;
	for(const auto& g : lines){
	  auto toks = bib::str::split(g, '\t');
	  sf.lines.emplace_back(SignalLine{toks[0],
		std::stof(toks[1]),
		std::stof(toks[2]),
		std::stoi(toks[3])});
	}
	ret.emplace_back(sf);
      }
      return ret;
    }
  };

  template <typename T>
  class Builder {
    T paths_;

  public:
    Builder(MousePaths paths)
      : paths_(paths)
    {}

    void build(){
      GetData<T> d(paths_);
      const auto peaks = d.peaks();
      const auto allGenes = d.allGenes();
      const auto pcGenes = d.pcGenes();
      d.loadSignals();
    }
  };

} // namespace bib

int main(int argc, char* argv[]){
  zi::parse_arguments(argc, argv, true);  // modifies argc and argv
  const auto args = std::vector<std::string>(argv + 1, argv + argc);

  try {
    bib::MousePaths paths("Y");
    bib::Builder<bib::MousePaths> b(paths);
    b.build();
  } catch(const std::exception& ex){
    std::cerr << ex.what() << std::endl;
    return 1;
  }

  return 0;
}
