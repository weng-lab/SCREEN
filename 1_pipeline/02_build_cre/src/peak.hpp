#pragma once

#include "gene.hpp"

namespace bib {

namespace bfs = boost::filesystem;

template <typename S, typename C>
S& join(S& s, const C& vec, const std::string delim){
    // http://stackoverflow.com/a/2519016
    for(auto it = vec.begin(); it != vec.end(); ++it ){
        if( it != vec.begin() ){
            s << delim;
        }
        s << *it;
    }
    return s;
}

class Peak {
public:

  std::string chrom;
  int32_t start;
  int32_t end;
  std::string rDHS;
  std::string accession;
  uint32_t creGroup;
  bool isProximal;
  
  std::vector<Gene> gene_nearest_all;
  std::vector<Gene> gene_nearest_pc;
  std::vector<Gene> tads;

  std::vector<float> conservation_signals;
  std::vector<float> ctcf_zscores;
  float ctcf_max;
  std::vector<float> dnase_zscores;
  float dnase_max;
  std::vector<float> enhancer_zscores;
  float enhancer_max;
  std::vector<float> h3k27ac_zscores;
  float h3k27ac_max;
  std::vector<float> h3k4me3_zscores;
  float h3k4me3_max;
  std::vector<float> insulator_zscores;
  float insulator_max;
  std::vector<float> promoter_zscores;
  float promoter_max;
  float maxz;
  
    Peak() {}
  
    Peak(const std::string& chrom, const int32_t start, const int32_t end,
	 const std::string& rDHS, const std::string& accession,
	 const uint32_t creGroup, const bool isProximal)
      : chrom(chrom)
      , start(start)
      , end(end)
      , rDHS(rDHS)
      , accession(accession)
      , creGroup(creGroup)
      , isProximal(isProximal)
    {}

  template <typename V>
  void setMax(const V& v, float& val){
    val = *std::max_element(v.begin(), v.end());
  }

  void setMaxZ(){
    maxz = std::max({ctcf_max, dnase_max, enhancer_max,
	  h3k27ac_max, h3k4me3_max, insulator_max, promoter_max});

  }
  
    template <typename S, typename T>
    void toTsvVec(S& s, const std::vector<T>& v)const {
        static const char d = '\t';

        s << d << "{ "; join(s, v, ",") << '}';
    }

    template <typename S>
    void toTsvGene(S& s, const std::vector<Gene>& genes) const {
        static const char d = '\t';

        std::vector<uint32_t> geneIDs(genes.size());
        std::vector<int32_t> distances(genes.size());
        for(uint32_t i = 0; i < genes.size(); ++i){
            geneIDs[i] = genes[i].geneID;
            distances[i] = genes[i].distance;
        }

        s << d << "{ "; join(s, distances, ",") << '}';
        s << d << "{ "; join(s, geneIDs, ",") << '}';
    }

    template <typename S>
    void toTsvTads(S& s, const std::vector<Gene>& genes) const {
        static const char d = '\t';

        std::vector<uint32_t> geneIDs(genes.size());
        for(uint32_t i = 0; i < genes.size(); ++i){
            geneIDs[i] = genes[i].geneID;
        }

        s << d << "{ "; join(s, geneIDs, ",") << '}';
    }

    std::string toTsv() const {
        static const char d = '\t';
        std::stringstream s;

        s << accession << d
          << rDHS << d
          << chrom << d
          << start << d
          << end << d
	  << creGroup << d
	  << isProximal;

        s << std::setprecision(4);

        toTsvVec(s, conservation_signals);
        toTsvVec(s, ctcf_zscores); s << ctcf_max << d;
	toTsvVec(s, dnase_zscores); s << dnase_max << d;
        toTsvVec(s, enhancer_zscores); s << enhancer_max << d;
        toTsvVec(s, h3k27ac_zscores); s << h3k27ac_max << d;
        toTsvVec(s, h3k4me3_zscores); s << h3k4me3_max << d;
        toTsvVec(s, insulator_zscores); s << insulator_max << d;
        toTsvVec(s, promoter_zscores); s << promoter_max << d;
	s << maxz << d;
        toTsvGene(s, gene_nearest_all);
        toTsvGene(s, gene_nearest_pc);
        toTsvTads(s, tads);

        s << '\n';
        return s.str();
    }

    friend auto& operator<<(std::ostream& s, const Peak& p){
        static const char d = '\t';

        s << p.accession << d
          << p.rDHS << d
          << p.chrom << d
          << p.start << d
          << p.end << d
	  << p.creGroup << d
	  << p.isProximal << "\n";

        s << std::setprecision(4);

        p.toTsvVec(s, p.conservation_signals); s << "\n";
        p.toTsvVec(s, p.ctcf_zscores); s << p.ctcf_max << "\n";
	p.toTsvVec(s, p.dnase_zscores); s << p.dnase_max << "\n";
        p.toTsvVec(s, p.enhancer_zscores); s << p.enhancer_max << "\n";
        p.toTsvVec(s, p.h3k27ac_zscores); s << p.h3k27ac_max << "\n";
        p.toTsvVec(s, p.h3k4me3_zscores); s << p.h3k4me3_max << "\n";
        p.toTsvVec(s, p.insulator_zscores); s << p.insulator_max << "\n";
        p.toTsvVec(s, p.promoter_zscores); s << p.promoter_max << "\n";
	s << p.maxz << "\n";
        p.toTsvGene(s, p.gene_nearest_all); s << "\n";
        p.toTsvGene(s, p.gene_nearest_pc); s << "\n";
        p.toTsvTads(s, p.tads); s << "\n";
        return s;
    }
};


} // namespace bib
