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
    std::string mpName;
    std::string accession;

    std::vector<Gene> gene_nearest_all;
    std::vector<Gene> gene_nearest_pc;
    std::vector<Gene> tads;

    std::vector<float> conservation_signal;
    std::vector<float> dnase_zscore;
    std::vector<float> ctcf_only_zscore;
    std::vector<float> ctcf_dnase_zscore;
    std::vector<float> h3k27ac_only_zscore;
    std::vector<float> h3k27ac_dnase_zscore;
    std::vector<float> h3k4me3_only_zscore;
    std::vector<float> h3k4me3_dnase_zscore;

    Peak() {}
  
    Peak(const std::string& chrom, const int32_t start, const int32_t end,
	 const std::string& mpName, const std::string& accession)
      : chrom(chrom)
      , start(start)
      , end(end)
      , mpName(mpName)
      , accession(accession)
    {}
    
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
          << mpName << d
          << chrom << d
          << start << d
          << end << d;

        s << std::setprecision(4);

        toTsvVec(s, conservation_signal);
	toTsvVec(s, dnase_zscore);
        toTsvVec(s, ctcf_only_zscore);
        toTsvVec(s, ctcf_dnase_zscore);
        toTsvVec(s, h3k27ac_only_zscore);
        toTsvVec(s, h3k27ac_dnase_zscore);
        toTsvVec(s, h3k4me3_only_zscore);
        toTsvVec(s, h3k4me3_dnase_zscore);
        toTsvGene(s, gene_nearest_all);
        toTsvGene(s, gene_nearest_pc);
        toTsvTads(s, tads);

        s << '\n';
        return s.str();
    }

    friend auto& operator<<(std::ostream& s, const Peak& p){
        static const char d = '\t';

        s << p.accession << d
          << p.mpName << d
          << p.chrom << d
          << p.start << d
          << p.end << "\n";

        s << std::setprecision(4);

        p.toTsvVec(s, p.conservation_signal); s << "\n";
	p.toTsvVec(s, p.dnase_zscore); s << "\n";
        p.toTsvVec(s, p.ctcf_only_zscore); s << "\n";
        p.toTsvVec(s, p.ctcf_dnase_zscore); s << "\n";
        p.toTsvVec(s, p.h3k27ac_only_zscore); s << "\n";
        p.toTsvVec(s, p.h3k27ac_dnase_zscore); s << "\n";
        p.toTsvVec(s, p.h3k4me3_only_zscore); s << "\n";
        p.toTsvVec(s, p.h3k4me3_dnase_zscore); s << "\n";
        p.toTsvGene(s, p.gene_nearest_all); s << "\n";
        p.toTsvGene(s, p.gene_nearest_pc); s << "\n";
        p.toTsvTads(s, p.tads); s << "\n";
        return s;
    }
};


} // namespace bib
