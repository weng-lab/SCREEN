#include "../../../../../common/json_processer.hpp"

#include <zi/zargs/zargs.hpp>
ZiARG_string(file, "", "file to load");
ZiARG_bool(first, false, "show first line");
ZiARG_int32(j, zi::system::cpu_count, "num threads");

namespace bib {

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
    rs.import(ZiARG_j);
  } catch(const std::exception& ex){
    std::cerr << ex.what() << std::endl;
    return 1;
  }

  return 0;
}
