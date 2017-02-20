#pragma once

#include "peaks.hpp"

namespace bib {

enum SignalLineEnum {
    ONLY, CONSERVATION, RANKZSCORE
};

template <typename T>
class GetData {
    T paths_;

    std::unordered_map<std::string, uint32_t> geneNameToID_;

public:
    GetData(T paths)
        : paths_(paths)
    {
        {
            bfs::path geneIDfnp = paths_.geneIDfnp();
            std::cout << "loading gene to ID " << geneIDfnp << std::endl;
            auto lines = bib::files::readStrings(geneIDfnp);
            for(const auto& p : lines){
                auto toks = bib::str::split(p, ',');
                geneNameToID_[toks[0]] = std::stoi(toks[2]);
            }
        }
    }

    // chrY    808996  809318  MP-2173311-100.000000   EE0756098
    Peaks peaks(){
        auto lines = bib::files::readStrings(paths_.peaks());
        std::cout << "loading peaks " << paths_.peaks() << std::endl;

        Peaks ret;
        ret.reserve(lines.size());
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            //auto mpToks = bib::str::split(toks[3], '-');
            ret.emplace(std::make_pair(toks[4],
				       Peak(toks[0],
					    std::stoi(toks[1]),
					    std::stoi(toks[2]),
					    toks[3],
					    toks[4])));
	}
        std::cout << "loaded " << ret.size() << " peaks\n";
        return ret;
    }

    MpNameToGenes tads(){
        MpNameToGenes ret;

        auto fnp = paths_.tads();
        if(!bfs::exists(fnp)){
            std::cerr << "TADs missing: " << fnp << std::endl;
            return ret;
        }
        auto lines = bib::files::readStrings(fnp);
        std::cout << "loading " << " tads " << fnp << std::endl;

        uint32_t count{0};
        ret.reserve(lines.size());
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            auto genes = bib::str::split(toks[1], ',');
            for(const auto& gene : genes){
                std::string ensembl = gene;
                bib::string::rtrim(ensembl);
                ret[toks[0]].emplace_back(Gene{geneNameToID_.at(ensembl), 0});
            }
            ++count;
        }
        std::cout << "loaded " << count << " tads\n";
        return ret;

    }


    // 0    1      2      3                   4    5      6      7                     8 9 10
    // chrY,141692,141850,MP-2173235-3.088310,chrY,206151,207788,ENSMUSG00000101796.1 ,.,+,64302
    MpNameToGenes allGenes(){
        return loadGenes(paths_.allGenes(), "all");
    }

    MpNameToGenes pcGenes(){
        return loadGenes(paths_.pcGenes(), "pc");
    }

    MpNameToGenes loadGenes(bfs::path fnp, std::string typ){
        std::cout << "loading " << typ << " genes " << fnp << std::endl;
        auto lines = bib::files::readStrings(fnp);

        std::cout << "found " << lines.size() <<  " lines for " << typ << " genes " << fnp << std::endl;
        uint32_t count{0};
        MpNameToGenes ret;
        ret.reserve(lines.size());
        for(const auto& g : lines){
            auto toks = bib::str::split(g, '\t');
            std::string ensembl = toks[8];
            std::string mp = toks[3];
            bib::string::rtrim(mp);
            bib::string::rtrim(ensembl);
            ret[mp].emplace_back(Gene{geneNameToID_.at(ensembl),
                        std::stoi(toks[10])}); // distance
            ++count;
        }
        std::cout << "loaded " << count << " " << typ << " genes\n";
        return ret;
    }

    std::vector<bfs::path> getFnps(const bfs::path& listFnp,
                                   const uint32_t numCols){
        std::vector<bfs::path> fnps;
        const auto lines = bib::files::readStrings(listFnp);
        for(const auto& g : lines){
            auto toks = bib::str::split(g, '\t');
            if(toks.size() != numCols){
                std::cerr << listFnp << std::endl;
                std::cerr << g << std::endl;
                std::cerr << toks.size() << " but expected "
                          << numCols << std::endl;
                throw std::runtime_error("wrong num cols");
            }
            std::string fn;
            switch (numCols){
            case 3:
                fn = toks[0] + '-' + toks[1] + ".txt";
                break;
            case 4:
                fn = toks[0] + '-' + toks[1] + ".txt";
                break;
            case 5:
                fn = toks[0] + '-' + toks[1] + '.'
                    + toks[2] + '-' + toks[3] + ".txt";
                break;
            case 6:
                fn = toks[0] + '-' + toks[1] + '.'
                    + toks[2] + '-' + toks[3] + ".txt";
                break;
            default:
                throw std::runtime_error("invalid num toks");
            };
            bfs::path fnp = paths_.signalDir() / fn;
            if(!bfs::exists(fnp)){
                std::cerr << "missing " << fnp << std::endl;
            }
            fnps.push_back(fnp);
        }
        std::cout << "found " << fnps.size() << " signal files"
                  << " from " << listFnp
                  << std::endl;
        return fnps;
    }

    template <typename V>
    void loadSignals(const bfs::path& listFnp, std::vector<V>& ret,
                     const uint32_t numCols, const SignalLineEnum sle){
        std::vector<bfs::path> fnps = getFnps(listFnp, numCols);
        ret.resize(fnps.size());

#pragma omp parallel for
        for(size_t i = 0; i < fnps.size(); ++i){
            const std::string fn = fnps[i].filename().string();
            const std::string fnp = fnps[i].string();

            V sf(fnp);
            const auto lines = bib::files::readStrings(fnp);

            sf.reserve(lines.size());

            for(const auto& g : lines){
                auto toks = bib::str::split(g, '\t');
                if(toks.size() > 5){
                    std::cerr << "too many toks for " << fnp << std::endl;
                    throw std::runtime_error("too many toks");
                }
                switch(sle){
                case CONSERVATION: sf.setSignalLineConservation(toks); break;
                case ONLY: sf.setSignalLineOnly(toks); break;
                case RANKZSCORE: sf.setSignalLineRankZscore(toks); break;
                }
            }
            ret[i] = std::move(sf);
        }
    }
};

} // namespace bib
