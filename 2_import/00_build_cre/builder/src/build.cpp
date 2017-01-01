#include "helpers.hpp"

#include <zi/zargs/zargs.hpp>
ZiARG_string(file, "", "file to load");
ZiARG_bool(first, false, "show first line");
ZiARG_int32(j, zi::system::cpu_count, "num threads");

namespace bib {

  template <typename T>
  class Builder {
    T paths_;

  public:
    Builder(MousePaths paths)
      : paths_(paths)
    {}

    Peaks build(){
      GetData<T> d(paths_);
      const auto allGenes = d.allGenes();
      const auto pcGenes = d.pcGenes();
      const auto signalFiles = d.loadSignals();

      Peaks peaks = d.peaks(); // map of peaks by accession

      std::vector<std::string> accessions;
      accessions.reserve(peaks.size());
      for(auto& kv : peaks){
	accessions.push_back(kv.first);
      }

      std::cout << "merging genes and signals into peaks...\n";
#pragma omp parallel for
      for(size_t i = 0; i < accessions.size(); ++i){
	const auto& accession = accessions[i];
	Peak& p = peaks[accession];
	processPeak(allGenes, pcGenes, signalFiles, p);
      }

      std::cout << peaks[accessions[0]] << std::endl;
      
      return peaks;
    }

    void processPeak(const MpNameToGenes& allGenes,
		     const MpNameToGenes& pcGenes,
		     const std::vector<SignalFile>& signalFiles,
		     Peak& p){
      const auto& i = p.mpName;
      p.genome = paths_.genome_;
      
      if(bib::in(i, allGenes)){
	//std::cout << i << " all\n";
	p.gene_nearest_all = allGenes.at(i);
	std::sort(p.gene_nearest_all.begin(),
		  p.gene_nearest_all.end());
      }

      if(bib::in(i, pcGenes)){
	//std::cout << i << " pc\n";
	p.gene_nearest_pc = pcGenes.at(i);
	std::sort(p.gene_nearest_pc.begin(),
		  p.gene_nearest_pc.end());
      }
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
