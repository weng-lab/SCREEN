#pragma once

class GeneIDer {
    const bfs::path d_;

    std::unordered_map<std::string, uint32_t> geneNameToID_;
    uint32_t count_ = 0;

    uint32_t getGeneID(const std::string& gene){
        if(!bib::in(gene, geneNameToID_)){
            geneNameToID_[gene] = ++count_;
        }
        return geneNameToID_[gene];
    }

public:
    GeneIDer(const bfs::path d)
        : d_(d)
    {}

    void loadBed(const bfs::path inFnp){
        std::cout << "loading bed " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            getGeneID(toks[7]);
        }
    }

    void loadTAD(const bfs::path inFnp){
        std::cout << "loading TAD " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            auto genes = bib::str::split(toks[1], ',');
            for(const auto& gene : genes){
                getGeneID(gene);
            }
        }
    }

    void save(){
        bfs::path outFnp = d_ / "ensebleToID.txt";
        std::ofstream out(outFnp.string(), std::ios::out | std::ios::trunc);
        for(const auto& kv : geneNameToID_){
            out << kv.first << ',' << kv.second << '\n';
        }
        std::cout << "wrote " << outFnp << std::endl;
    }

    void run(){
        for(const auto& fn : {"AllGenes.bed", "PCGenes.bed"}){
            bfs::path inFnp = d_ / fn;
            loadBed(inFnp);
        }
        if("hg19" == ZiARG_assembly){
            bfs::path inFnp = d_ / "TADs.txt";
            loadTAD(inFnp);
        }
        save();
    }
};
