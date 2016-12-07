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
#include "cpp/gzip_reader.hpp"
#include "cpp/tictoc.hpp"
#include "cpp/gzstream.hpp"

#include "simpleObjectPool.hpp"

#include <zi/zargs/zargs.hpp>
ZiARG_string(file, "", "file to load");
ZiARG_bool(first, false, "show first line");
ZiARG_int32(j, zi::system::cpu_count, "num threads");

namespace bib {

  namespace bfs = boost::filesystem;

  struct Constants {
    enum lengths { Len = 250 };
  };
  struct ArrayPool {
    std::array<std::string, Constants::Len> strs;
    std::array<uint64_t, Constants::Len> idxs;
  };

  template <typename T>
  class LockedFileWriter{
    bfs::path fnp_;
    std::mutex mutex_;
    std::unique_ptr<T> out_;
    
  public:
    LockedFileWriter(bfs::path fnp)
      : fnp_(fnp)
    {
      out_ = std::make_unique<T>(fnp_.string(), std::ios::out | std::ios::trunc);
    }

    template <typename C>
    void write(const C& lines, const size_t len){
      std::lock_guard<std::mutex> lock(mutex_);
      auto& out = *out_;
      for(size_t i = 0; i < len; ++i){
	out << lines[i];
      }
    }
  };

  class ReadJson{
    const bfs::path inFnp_;
    const bfs::path outFnp_;
    
    std::unique_ptr<LockedFileWriter<GZSTREAM::ogzstream>> out_;

    
  public:
    ReadJson(bfs::path inFnp, bfs::path outFnp)
      : inFnp_(inFnp)
      , outFnp_(outFnp)
    {      out_ = std::make_unique<LockedFileWriter<GZSTREAM::ogzstream>>(outFnp_);
    }
    
    SimpleObjectPool<ArrayPool> arrays_;

    virtual Json::Value run(const Json::Value& v) = 0;
    
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
      auto& a = *ap;
      auto op = arrays_.get();
      auto& out = *op;
      for(uint32_t i = 0; i < len; ++i){
	out.strs[i] = parseLine(a.strs[i]);
      }
      out_->write(out.strs, len);
      arrays_.put(ap);
      arrays_.put(op);
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
     
      return Json::FastWriter().write(run(root));
    }
  };

  class ReWriteJson : public ReadJson {
    
  public:
    ReWriteJson(bfs::path inFnp, bfs::path outFnp)
      : ReadJson(inFnp, outFnp)
    {}

    virtual Json::Value run(const Json::Value& j){
      std::string accession = j["accession"].asString();

      return j;

      //std::cout << accession << std::endl;

      // top-level: accession, genes, genome, neg-log-p, position, ranks, stam_id
      // genes: nearest-all, nearest-pc, tads
      // genome
      // neg-log-p
      // position: chrom, end, start
      // ranks: conservation ctcf dnase enhancer promoter
				
      for(const auto e : j["ranks"]["dnase"].getMemberNames()){
	std::cout << ' ' << e;
      }

      exit(1);      
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
    bib::ReWriteJson rs(args[0], args[1]);
    // rs.parse();
    rs.import();
  } catch(const std::exception& ex){
    std::cerr << ex.what() << std::endl;
    return 1;
  }

  return 0;
}
