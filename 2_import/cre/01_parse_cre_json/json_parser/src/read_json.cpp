#include <boost/filesystem.hpp>
#include <boost/log/trivial.hpp>
#include <boost/log/utility/setup.hpp>

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
#include "cpp/gzip_reader.hpp"
#include "cpp/tictoc.hpp"

#include "simpleObjectPool.hpp"

#include <zi/zargs/zargs.hpp>
ZiARG_string(file, "", "file to load");
ZiARG_bool(first, false, "show first line");
ZiARG_int32(j, zi::system::cpu_count, "num threads");

namespace bib {

  namespace bfs = boost::filesystem;

  class ReadJson{
    const bfs::path inFnp_;
    const bfs::path outFnp_;

  public:
    ReadJson(bfs::path inFnp, bfs::path outFnp)
      : inFnp_(inFnp)
      , outFnp_(outFnp)
    {}

    struct Constants {
      enum lengths { Len = 250 };
    };
    struct ArrayPool {
      std::array<std::string, Constants::Len> strs;
      std::array<uint64_t, Constants::Len> idxs;
    };
    SimpleObjectPool<ArrayPool> arrays_;

    void import(){
      TicToc t("done import");

      std::cout << "starting import..." << std::endl;

      zi::task_manager::simple tm(ZiARG_j);
      tm.start();

      auto a = arrays_.get();
      uint32_t counter = 0;
      uint64_t line_counter = 1; // skip idx 0 in mem-map

      Gzip_reader r(inFnp_);
      while(likely(r.getline(a->strs[counter]))){
	a->idxs[counter] = line_counter++;
	++counter;
	if(unlikely(Constants::Len == counter)){
	  tm.insert(zi::run_fn(zi::bind(&ReadJson::parseVec, this, a, Constants::Len)));
	  a = arrays_.get();
	  counter = 0;
	  std::cout << line_counter << " " << tm.size() << std::endl;
	}
      }

      // parse remainder that weren't added to pool
      parseVec(a, counter);

      tm.join();
    }

    void parseVec(std::shared_ptr<ArrayPool> ap, uint32_t len){
      std::cout << len << std::endl;
      auto& a = *ap;
      auto outArray = arrays_.get();
      auto& out = *outArray;
      for(uint32_t i = 0; i < len; ++i){
	out.strs[i] = parseLine(a.strs[i]);
      }
      arrays_.put(ap);
    }

    std::string parseLine(const std::string& line){
      Json::Value root;
      Json::Reader reader;
      if (!reader.parse(line, root, false)) {
	std::cerr << reader.getFormattedErrorMessages() << std::endl;
	std::cerr << line << std::endl;
	return "";
      }
    
      if(ZiARG_first){
	std::cout << root << std::endl;
	return "";
      }
    
      return doParseLine(root);
    }

    std::string doParseLine(const Json::Value& root){
      std::string ensembl_id = root["ensembl_id"].asString();
      std::string gene_name = root["gene_name"].asString();

      for(const auto& n : root["expression_values"]){
	std::string dataset;
	std::map<int, std::map<std::string, float>> vals;
	for(const auto e : n.getMemberNames()){
	  if("dataset" == e){
	    dataset = n[e].asString();
	    continue;
	  }
	  if(!("rep" == e.substr(0, 3))){
	    std::cout << "unknown " << e << "\n";
	    std::exit(1);
	  }
	  auto toks = bib::str::split(e, '_');
	  int8_t repNum = toks[0][3] - '0';
	  vals[repNum][toks[1]] = n[e].asFloat();
	}
      }

      return "";
    }
  };
} // namespace bib

int main(int argc, char* argv[]){
  zi::parse_arguments(argc, argv, true);  // modifies argc and argv
  const auto args = std::vector<std::string>(argv + 1, argv + argc);

  if(2 != args.size()){
    std::cerr << "expect 2 JSON files" << std::endl;
    return 1;
  }

  try {
    bib::ReadJson rs(args[0], args[1]);
    // rs.parse();
    rs.import();
  } catch(const std::exception& ex){
    std::cerr << ex.what() << std::endl;
    return 1;
  }

  return 0;
}
