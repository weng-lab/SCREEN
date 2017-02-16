#pragma once

namespace bib {
  
  class HumanMousePaths {
  public:
    const std::string genome_;
    const std::string chr_;
    const bfs::path base_;
    bfs::path path_;

    HumanMousePaths(std::string assembly, const std::string chr, bfs::path base)
      : genome_(assembly)
      , chr_(chr)
      , base_(base)
    {
      path_ = base_ / chr_;
    }

    bfs::path allGenes(){ return path_ / "all_cre_genes.bed.gz"; }
    bfs::path pcGenes(){ return path_ / "pc_cre_genes.bed.gz"; }
    bfs::path peaks(){ return path_ / "masterPeaks.bed"; }
    bfs::path tads(){ return path_ / "TADs.txt"; }
    bfs::path geneIDfnp(){ return base_ / "ensebleToID.txt"; }
    bfs::path signalDir(){
      return path_ / "signal-output";
    }

    bfs::path listFile(const std::string name){
      return base_ / (name + "-List.txt");
    }
  };


} // namespace bib
