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
    
    void import(uint32_t numThreads){
      TicToc t("done import");

      std::cout << "starting import..." << std::endl;

      zi::task_manager::simple tm(numThreads);
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
    
      if(0){
	std::cout << root << std::endl;
	return "";
      }
     
      return Json::FastWriter().write(run(root));
    }
  };

} // namespace
