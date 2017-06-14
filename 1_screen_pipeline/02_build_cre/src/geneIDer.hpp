#pragma once

#include "paths.hpp"

namespace bib {

class GeneIDer {
    const bfs::path raw_;
    const bfs::path extras_;

    std::unordered_map<std::string, uint32_t> geneNameToID_;
    uint32_t count_ = 0;

    uint32_t getGeneID(const std::string& gene){
        if(!bib::in(gene, geneNameToID_)){
            geneNameToID_[gene] = ++count_;
        }
        return geneNameToID_[gene];
    }

public:
    GeneIDer(const bfs::path raw, const bfs::path extras)
        : raw_(raw)
        , extras_(extras)
    {}

    void loadBed(const bfs::path inFnp){
        std::cout << "geneIDer: loading bed " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            if(toks.size() != 3){
                throw std::runtime_error("invalid length");
            }
            std::string ensembl = toks[1];
            bib::string::rtrim(ensembl);
            getGeneID(ensembl);
        }
        std::cout << "done " << inFnp << " " << geneNameToID_.size() << std::endl;
    }

    void loadTAD(const bfs::path inFnp){
        std::cout << "geneIDer: loading TAD " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            if(toks.size() != 4){
                throw std::runtime_error("invalid length");
            }
            auto genes = bib::str::split(toks[3], ',');
            for(const auto& gene : genes){
                std::string ensembl = gene;
                bib::string::rtrim(ensembl);
                getGeneID(ensembl);
            }
        }
        std::cout << "done " << inFnp << " " << geneNameToID_.size() << std::endl;
    }

    void save(){
        bfs::path outFnp = extras_ / FileNames::EnsembleToID;
        bfs::create_directories(outFnp.parent_path());

        std::ofstream out(outFnp.string(), std::ios::out | std::ios::trunc);
        for(const auto& kv : geneNameToID_){
            auto toks = bib::str::split(kv.first, '.');
            out << kv.first << ',' << toks[0] << ',' << kv.second << '\n';
        }
        std::cout << "wrote " << outFnp << std::endl;
    }

    void run(){
        for(const auto& fn : {FileNames::AllGenes, FileNames::PcGenes}){
            bfs::path inFnp = raw_ / fn;
            loadBed(inFnp);
        }
        if("hg19" == ZiARG_assembly){
            bfs::path inFnp = raw_ / FileNames::Tads;
            loadTAD(inFnp);
        }
        save();
    }
};

} // namespace bib
