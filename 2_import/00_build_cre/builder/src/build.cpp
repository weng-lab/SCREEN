#include "helpers.hpp"

#include <zi/zargs/zargs.hpp>
ZiARG_string(chr, "", "chrom to load");
ZiARG_bool(first, false, "show first line");
ZiARG_int32(j, 5, "num threads");

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

      if(0){
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

    void dumpToJson(bfs::path d){
      const auto& accessions = peaks_.accessions();
      bfs::path fnp = d / ("parsed." + paths_.chr_ + ".json");

      std::vector<std::string> lsj(accessions.size());
      
      std::cout << "dumping to JSON...\n";
      {
	TicToc tt("dump to JSON strings");
#pragma omp parallel for
	for(size_t i = 0; i < accessions.size(); ++i){
	  const auto& accession = accessions[i];
	  Peak& p = peaks_[accession];
	  Json::FastWriter fastWriter;
	  lsj[i] = fastWriter.write(p.toJson());
	}
      }

      {
	TicToc tt("write to file");
	std::ofstream out(fnp.string(), std::ios::out | std::ios::trunc);
	for(const auto& j : lsj){
	  out << j;
	}
      }

      std::cout << "\twrote " << fnp << " " << lsj.size() << std::endl;
    }

    void dumpToTsv(bfs::path d){
      const auto& accessions = peaks_.accessions();

      std::vector<std::string> tsv(accessions.size());
      
      std::cout << "dumping to TSV...\n";
      {
	TicToc tt("dump to TSV strings");
#pragma omp parallel for
	for(size_t i = 0; i < accessions.size(); ++i){
	  const auto& accession = accessions[i];
	  Peak& p = peaks_[accession];
	  tsv[i] = p.toTsv();
	}
      }

      {
	bfs::path fnp = d / ("parsed.headers." + paths_.chr_ + ".tsv");
	TicToc tt("write to " + fnp.string());
	{
	  std::ofstream out(fnp.string(), std::ios::out | std::ios::trunc);
	  std::vector<std::string> header {"accession",
	      "mpName", "negLogP", "chrom", "start", "end",
	      "conservation_rank", "conservation_signal",
	      "dnase_rank", "dnase_signal", "dnase_zscore",
	      "ctcf_only_rank", "ctcf_only_zscore",
	      "ctcf_dnase_rank", "ctcf_dnase_zscore",
	      "h3k27ac_only_rank", "h3k27ac_only_zscore",
	      "h3k27ac_dnase_rank", "h3k27ac_dnase_zscore",
	      "h3k4me3_only_rank", "h3k4me3_only_zscore",
	      "h3k4me3_dnase_rank", "h3k4me3_dnase_zscore"};
	  out << bib::string::join(header, "\t") << "\n";
	}
	std::cout << "\twrote " << fnp << std::endl;
      }
      {
	bfs::path fnp = d / ("parsed." + paths_.chr_ + ".tsv");
	TicToc tt("write to " + fnp.string());
	{
	  std::ofstream out(fnp.string(), std::ios::out | std::ios::trunc);
	  for(const auto& j : tsv){
	    out << j;
	  }
	}
	std::cout << "\twrote " << fnp << " " << tsv.size() << std::endl;
      }
    }
};

} // namespace bib

void runChrom(const std::string chrom, const bfs::path d){
  bib::MousePaths paths(chrom);
  bib::Builder<bib::MousePaths> b(paths);

  {
    bib::TicToc tt("build time");
    b.build();
  }
  {
    if(0){
      bib::TicToc tt("JSON dump time");
      b.dumpToJson(d);
    } else {
      bib::TicToc tt("tsv dump time");
      b.dumpToTsv(d);
    }
  }
}

int main(int argc, char* argv[]){
  zi::parse_arguments(argc, argv, true);  // modifies argc and argv
  const auto args = std::vector<std::string>(argv + 1, argv + argc);

  std::vector<std::string> chroms{"chr01", "chr02", "chr03", "chr04", "chr05",
      "chr06", "chr07", "chr08", "chr09", "chr10", "chr11", "chr12", "chr13",
      "chr14", "chr15", "chr16", "chr17", "chr18", "chr19", "chrX", "chrY"};
  if(ZiARG_chr > ""){
    chroms = {ZiARG_chr};
  }

  bfs::path d = "/tmp/";

  try {
      zi::task_manager::simple tm(ZiARG_j);
      tm.start();
      for(const auto& chrom : chroms){
	tm.insert(zi::run_fn(zi::bind(&runChrom, chrom, d)));
      }
      tm.join();

  } catch(const std::exception& ex){
    std::cerr << ex.what() << std::endl;
    return 1;
  }

  return 0;
}
