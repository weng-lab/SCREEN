#include "helpers.hpp"

#include <zi/zargs/zargs.hpp>
ZiARG_string(file, "", "file to load");
ZiARG_bool(first, false, "show first line");
ZiARG_int32(j, zi::system::cpu_count, "num threads");

namespace bib {

  template <typename T>
  class Builder {
    T paths_;

    Peaks peaks_; // map of peaks by accession
  
  public:
    Builder(MousePaths paths)
      : paths_(paths)
    {}

    void build(){
      DataHelper d(paths_, peaks_);

      const auto& accessions = peaks_.accessions();

      std::cout << "merging genes and signals into peaks...\n";
#pragma omp parallel for
      for(size_t i = 0; i < accessions.size(); ++i){
	const auto& accession = accessions[i];
	Peak& p = peaks_[accession];
	processPeak(d, p);
      }

      const std::string a = "EE0022963";
      if(bib::in(a, peaks_)){
	Peak& p = peaks_[a];
	if(0){
	  std::cout << p << std::endl;
	}else {

	  Json::StyledWriter styledWriter;
	  std::cout << styledWriter.write(p.toJson());
	}
      }
    }

    void processPeak(const DataHelper& d, Peak& p){
      const std::string& mpName = p.mpName;
      p.genome = paths_.genome_;

      d.setAllGenes(mpName, p.gene_nearest_all);
      d.setPcGenes(mpName, p.gene_nearest_pc);

      d.setDNaseRanks(p);
      d.setCTCFRanks(p);
      d.setEnhancerRanks(p);
      d.setPromoterRanks(p);
      d.setConservationRanks(p);
    }

    void dumpToJson(){
      const auto& accessions = peaks_.accessions();

      std::cout << "dumping to JSON...\n";
      for(size_t i = 0; i < accessions.size(); ++i){
	const auto& accession = accessions[i];
	Peak& p = peaks_[accession];
	const auto j = p.toJson();
	break;
      }
    }
  };

} // namespace bib

int main(int argc, char* argv[]){
  zi::parse_arguments(argc, argv, true);  // modifies argc and argv
  const auto args = std::vector<std::string>(argv + 1, argv + argc);

  try {
    bib::MousePaths paths("chr19");
    bib::Builder<bib::MousePaths> b(paths);
    b.build();
  } catch(const std::exception& ex){
    std::cerr << ex.what() << std::endl;
    return 1;
  }

  return 0;
}
