#pragma once

#include "gene.hpp"

namespace bib {

namespace bfs = boost::filesystem;

class Peak {
public:
    std::string chrom;
    int32_t start;
    int32_t end;
    std::string mpName;
    std::string negLogP;
    std::string accession;

    std::string genome;

    std::vector<Gene> gene_nearest_all;
    std::vector<Gene> gene_nearest_pc;
    std::vector<Gene> tads;

    // celltype to rank info (order matters)
    std::map<std::string, RankDNase> ranksDNase_;

    // convservation type to rank info (order matters)
    std::map<std::string, RankConservation> ranksConservation_;

    // celltype to multi-ranks (order matters)
    std::map<std::string, RankContainer> ranksCTCF_;
    std::map<std::string, RankContainer> ranksEnhancer_;
    std::map<std::string, RankContainer> ranksPromoter_;

    Json::Value toJson() const {
        Json::Value r;
        r["accession"] = accession;
        r["stam_id"] = mpName;
        r["genome"] = genome;
        r["neg-log-p"] = negLogP;

        Json::Value pos;
        pos["chrom"] = chrom;
        pos["start"] = start;
        pos["end"] = end;
        r["position"] = pos;

        for(const auto& g : gene_nearest_all){
            r["genes"]["nearest-all"].append(g.toJson());
        }
        for(const auto& g : gene_nearest_pc){
            r["genes"]["nearest-pc"].append(g.toJson());
        }

        for(const auto& kv: ranksConservation_){
            r["ranks"]["conservation"][kv.first] = kv.second.toJson();
        }
        for(const auto& kv: ranksDNase_){
            r["ranks"]["dnase"][kv.first] = kv.second.toJson();
        }
        for(const auto& kv: ranksCTCF_){
            r["ranks"]["ctcf"][kv.first] = kv.second.toJson();
        }
        for(const auto& kv: ranksEnhancer_){
            r["ranks"]["enhancer"][kv.first] = kv.second.toJson();
        }
        for(const auto& kv: ranksPromoter_){
            r["ranks"]["promoter"][kv.first] = kv.second.toJson();
        }
        return r;
    }

    void toTsvRankContainer(std::stringstream& s,
                            const std::map<std::string, RankContainer>& rc,
                            const std::string onlyKey,
                            const std::string multiKey) const {
        static const char d = '\t';
        static const char c = ',';

        // only
        for(const auto& kv: rc){
            if(kv.second.has(onlyKey)){
                s << kv.second.at(onlyKey).rank_ << c;
            }
        }
        s.seekp(-1, s.cur);
        s << '}' << d << "{ ";
        for(const auto& kv: rc){
            if(kv.second.has(onlyKey)){
                s << kv.second.at(onlyKey).zscore_ << c;
            }
        }
        s.seekp(-1, s.cur);
        s << '}' << d << "{ ";
        // multi
        for(const auto& kv: rc){
            if(kv.second.has(multiKey)){
                s << kv.second.at(multiKey).rank_ << c;
            }
        }
        s.seekp(-1, s.cur); s << '}' << d << "{ ";
        for(const auto& kv: rc){
            if(kv.second.has(multiKey)){
                s << kv.second.at(multiKey).zscore_ << c;
            }
        }
    }

    void toTsvGene(std::stringstream& s,
                   const std::vector<Gene>& genes) const {
        static const char d = '\t';
        static const char c = ',';

        for(const auto& g : genes){
            s << g.distance << c;
        }
        s.seekp(-1, s.cur); s << '}' << d << "{ ";
        for(const auto& g : genes){
            s << g.geneID << c;
        }
    }

    void toTsvTads(std::stringstream& s,
                   const std::vector<Gene>& genes) const {
        static const char c = ',';

        for(const auto& g : genes){
            s << g.geneID << c;
        }
    }

    std::string toTsv() const {
        static const char d = '\t';
        static const char c = ',';
        std::stringstream s;

        s << accession << d
          << mpName << d
          << negLogP << d
          << chrom << d
          << start << d
          << end << d;

        s << std::setprecision(4);

        // conservation
        s << "{ ";
        for(const auto& kv: ranksConservation_){
            s << kv.second.rank_ << c;
        }
        s.seekp(-1, s.cur); s << '}' << d << "{ ";
        for(const auto& kv: ranksConservation_){
            s << kv.second.signal_ << c;
        }
        s.seekp(-1, s.cur); s << '}' << d << "{ ";

        // DNase
        for(const auto& kv: ranksDNase_){
            s << kv.second.rank_ << c;
        }
        s.seekp(-1, s.cur); s << '}' << d << "{ ";
        for(const auto& kv: ranksDNase_){
            s << kv.second.signal_ << c;
        }
        s.seekp(-1, s.cur); s << '}' << d << "{ ";
        for(const auto& kv: ranksDNase_){
            s << kv.second.zscore_ << c;
        }
        s.seekp(-1, s.cur); s << '}' << d << "{ ";
        toTsvRankContainer(s, ranksCTCF_, "CTCF-only", "DNase+CTCF");
        s.seekp(-1, s.cur); s << '}' << d << "{ ";
        toTsvRankContainer(s, ranksEnhancer_, "H3K27ac-only", "DNase+H3K27ac");
        s.seekp(-1, s.cur); s << '}' << d << "{ ";
        toTsvRankContainer(s, ranksPromoter_, "H3K4me3-only", "DNase+H3K4me3");
        s.seekp(-1, s.cur); s << '}' << d << "{ ";
        toTsvGene(s, gene_nearest_all);
        s.seekp(-1, s.cur); s << '}' << d << "{ ";
        toTsvGene(s, gene_nearest_pc);
        s.seekp(-1, s.cur); s << '}' << d << "{ ";
        toTsvTads(s, tads);
        s.seekp(-1, s.cur); s << '}';

        s << '\n';
        return s.str();
    }

    friend auto& operator<<(std::ostream& s, const Peak& p){
        s << p.accession << "\n";
        s << "\t" << p.mpName << "\n";
        s << "\tposition: " << p.chrom << ":" << p.start << "-" << p.end << "\n";
        s << "\tall genes:\n";
        for(const auto& g : p.gene_nearest_all){
            s << "\t\t" << g << "\n";
        }
        s << "\tpc genes:\n";
        for(const auto& g : p.gene_nearest_pc){
            s << "\t\t" << g << "\n";
        }
        s << "\tgenome: " << p.genome << "\n";
        s << "\tneg-log-p: " << p.negLogP << "\n";

        s << "\tRanks: Conservation:\n";
        for(const auto& kv: p.ranksConservation_){
            s << "\t\t" << kv.first << " " << kv.second << "\n";
        }
        s << "\tRanks: CTCF:\n";
        for(const auto& kv: p.ranksCTCF_){
            s << "\t\t" << kv.first << "\n" << kv.second;
        }
        s << "\tRanks: DNase:\n";
        for(const auto& kv: p.ranksDNase_){
            s << "\t\t" << kv.first << " " << kv.second << "\n";
        }
        s << "\tRanks: Enhancer:\n";
        for(const auto& kv: p.ranksEnhancer_){
            s << "\t\t" << kv.first << "\n" << kv.second;
        }
        s << "\tRanks: Promoter:\n";
        for(const auto& kv: p.ranksPromoter_){
            s << "\t\t" << kv.first << "\n" << kv.second;
        }
        return s;
    }
};


} // namespace bib
