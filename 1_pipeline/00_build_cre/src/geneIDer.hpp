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
        std::cout << "geneIDer: loading bed " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            if(toks.size() < 11){
                std::cout << "will skip" << std::endl;
                std::cout << p << "\n" << "len" << toks.size() << "\n";
                continue;
            }
            std::string ensembl = toks[7];
            bib::string::rtrim(ensembl);
            getGeneID(ensembl);
        }
        std::cout << "done" << std::endl;;
    }

    void loadTAD(const bfs::path inFnp){
        std::cout << "geneIDer: loading TAD " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            auto genes = bib::str::split(toks[1], ',');
            for(const auto& gene : genes){
                std::string ensembl = gene;
                bib::string::rtrim(ensembl);
                getGeneID(ensembl);
            }
        }
    }

    void save(){
        bfs::path outFnp = d_ / "ensebleToID.txt";
        std::ofstream out(outFnp.string(), std::ios::out | std::ios::trunc);
        for(const auto& kv : geneNameToID_){
            auto toks = bib::str::split(kv.first, '.');
            out << kv.first << ',' << toks[0] << ',' << kv.second << '\n';
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
