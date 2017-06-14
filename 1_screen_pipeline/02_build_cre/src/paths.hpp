#include <string>

#include <boost/filesystem.hpp>

#pragma once

namespace bib {

  namespace bfs = boost::filesystem;

  struct FileNames {
    static const std::string AllGenes;
    static const std::string PcGenes;
    static const std::string Tads;
    static const std::string cREs;
    static const std::string EnsembleToID;
  };

  class HumanMousePaths {
  public:
    const std::string genome_;
    const std::string chr_;

    const bfs::path raw_;
    const bfs::path extras_;
    bfs::path path_;

    HumanMousePaths(std::string assembly, const std::string chr,
                    const bfs::path raw, const bfs::path extras)
      : genome_(assembly)
      , chr_(chr)
      , raw_(raw)
      , extras_(extras)
    {
      path_ = extras_ / chr_;
    }

    bfs::path allGenes(){ return path_ / FileNames::AllGenes; }
    bfs::path pcGenes(){ return path_ / FileNames::PcGenes; }
    bfs::path peaks(){ return path_ / FileNames::cREs; }
    bfs::path tads(){ return path_ / FileNames::Tads; }
    bfs::path geneIDfnp(){ return extras_ / FileNames::EnsembleToID; }
    bfs::path signalDir(){
      return path_ / "signal-output";
    }

    bfs::path listFile(const std::string name){
      return raw_ / (name + "-list.txt");
    }
  };


} // namespace bib
