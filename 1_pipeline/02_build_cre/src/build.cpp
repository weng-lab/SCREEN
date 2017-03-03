#include <zi/zargs/zargs.hpp>
ZiARG_string(chr, "", "chrom to load");
ZiARG_string(assembly, "mm10", "assembly");
ZiARG_string(ver, "ver10", "version");
ZiARG_bool(first, false, "show first line");
ZiARG_bool(split, false, "split up files");
ZiARG_int32(j, 1, "num threads");

#include "data_helper.hpp"
#include "splitter.hpp"
#include "geneIDer.hpp"

namespace bib {

  template <typename T>
  class Builder {
    T paths_;

    Peaks peaks_; // map of peaks by accession
  public:
    Builder(const T& paths)
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
    }

    void processPeak(const DataHelper& d, Peak& p){
      const std::string& rDHS = p.rDHS;

      if("hg19" == ZiARG_assembly){
	d.setTads(rDHS, p);
      }

      d.setAllGenes(rDHS, p);
      d.setPcGenes(rDHS, p);

      d.set(rDHS, p.conservation_signals, d.conservation_files_);

      d.set(rDHS, p.ctcf_zscores, d.ctcf_files_);
      p.setMax(p.ctcf_zscores, p.ctcf_max);
	
      d.set(rDHS, p.dnase_zscores, d.dnase_files_);
      p.setMax(p.dnase_zscores, p.dnase_max);
	
      d.set(rDHS, p.enhancer_zscores, d.enhancer_files_);
      p.setMax(p.enhancer_zscores, p.enhancer_max);
	
      d.set(rDHS, p.h3k27ac_zscores, d.h3k27ac_files_);
      p.setMax(p.h3k27ac_zscores, p.h3k27ac_max);
	
      d.set(rDHS, p.h3k4me3_zscores, d.h3k4me3_files_);
      p.setMax(p.h3k4me3_zscores, p.h3k4me3_max);
		 
      d.set(rDHS, p.insulator_zscores, d.insulator_files_);
      p.setMax(p.insulator_zscores, p.insulator_max);
	
      d.set(rDHS, p.promoter_zscores, d.promoter_files_);
      p.setMax(p.promoter_zscores, p.promoter_max);

      p.setMaxZ();
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

      // write header lines
      {
	bfs::path fnp = d / "headers" / ("headers." + paths_.chr_ + ".tsv");
	bfs::create_directories(fnp.parent_path());
	
	TicToc tt("write to " + fnp.string());
	{
	  std::ofstream out(fnp.string(), std::ios::out | std::ios::trunc);
	  std::vector<std::string> header {
	    "accession", 
	      "rDHS",
	      "chrom", "start", "end",
	      "creGroup",
	      "isProximal",
	      "conservation_signals", "conservation_max",
	      "ctcf_zscores", "ctcf_max",
	      "dnase_zscores", "dnase_max",
	      "enhancer_zscores", "enhancer_max",
	      "h3k27ac_zscores", "h3k27ac_max",
	      "h3k4me3_zscores", "h3k4me3_max",
	      "insulator_zscores", "insulator_max",
	      "promoter_zscores", "promoter_max",
	      "maxz",
	      "gene_all_distance", "gene_all_name",
	      "gene_pc_distance", "gene_pc_name",
	      "tads"};
	  out << bib::string::join(header, "\t") << "\n";
	}
	std::cout << "\twrote " << fnp << std::endl;
      }

      // write TSVs w/ data
      {
	bfs::path fnp = d / (paths_.chr_ + ".tsv");
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

void runChrom(const std::string chrom, const bfs::path raw, const bfs::path extras,
	      const bfs::path base){
  bib::HumanMousePaths paths(ZiARG_assembly, chrom, raw, extras);
  bib::Builder<bib::HumanMousePaths> b(paths);

  {
    bib::TicToc tt("build time");
    b.build();
  }
  {
    bfs::path outD = extras.parent_path() / "output";
    bfs::create_directories(outD);
    bib::TicToc tt("tsv dump time");
    b.dumpToTsv(outD);
  }
}


int main(int argc, char* argv[]){
  zi::parse_arguments(argc, argv, true);  // modifies argc and argv
  const auto args = std::vector<std::string>(argv + 1, argv + argc);

  const std::vector<std::string> hg19_chroms{"chr1", "chr2", "chr3", "chr4",
      "chr5", "chr6", "chr7", "chr8", "chr9", "chr10", "chr11", "chr12",
      "chr13", "chr14", "chr15", "chr16", "chr17", "chr18", "chr19",
      "chr20", "chr21", "chr22", "chrX", "chrY"};
  const std::vector<std::string> mm10_chroms{"chr1", "chr2", "chr3", "chr4",
      "chr5", "chr6", "chr7", "chr8", "chr9", "chr10", "chr11", "chr12",
      "chr13", "chr14", "chr15", "chr16", "chr17", "chr18", "chr19",
      "chrX", "chrY"};

  std::vector<std::string> chroms;
  if("hg19" == ZiARG_assembly){
    chroms = hg19_chroms;
  } else if("mm10" == ZiARG_assembly){
    chroms = mm10_chroms;
  } else {
    throw std::runtime_error("unknown assembly: " + ZiARG_assembly);
  }

  if(ZiARG_chr > ""){
    chroms = {ZiARG_chr};
  }

  bfs::path base= "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4";
  base /= ZiARG_ver;
  base /= ZiARG_assembly;
  const bfs::path raw =  base / "raw";
  if(!bfs::exists(raw)){
    throw std::runtime_error("missing " + raw.string());
  }
  const bfs::path extras =  base / "extras";
  bfs::create_directories(extras);

  if(ZiARG_split){
    bib::Splitter s(raw, extras, chroms);
    s.run();
    return 0;
  }

  if(1){
    bib::GeneIDer g(raw, extras);
    g.run();
  }else{
    std::cerr << "pleae turn me back on" << std::endl;
  }

  try {
    zi::task_manager::simple tm(ZiARG_j);
    tm.start();
    for(const auto& chrom : chroms){
      tm.insert(zi::run_fn(zi::bind(&runChrom, chrom, raw, extras, base)));
    }
    tm.join();

  } catch(const std::exception& ex){
    std::cerr << ex.what() << std::endl;
    return 1;
  }

  return 0;
}
