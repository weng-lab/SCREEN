#pragma once

#include "paths.hpp"

namespace bib {

class Splitter {
    const bfs::path raw_;
    const bfs::path extras_;
    const std::vector<std::string>& chroms_;

    std::unordered_map<std::string, std::string> rDhsToChr_;
    std::unordered_map<std::string, std::string> accessionToChr_;

public:
    Splitter(const bfs::path raw, const bfs::path extras,
             const std::vector<std::string>& chroms)
        : raw_(raw)
        , extras_(extras)
        , chroms_(chroms)
    {
        loadMasterPeaks();
    }

    void loadMasterPeaks(){
        bfs::path inFnp = raw_ / FileNames::cREs;

        std::cout << "loading " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);

        rDhsToChr_.reserve(lines.size());
        accessionToChr_.reserve(lines.size());
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            rDhsToChr_[toks[3]] = toks[0];
            accessionToChr_[toks[4]] = toks[0];
        }
        std::cout << "\tfound " << rDhsToChr_.size() << " peaks\n";
    }

    void splitSignalFile(const bfs::path inFnp){
        std::unordered_map<std::string, std::vector<std::string>> chromToLines;
        std::cout << "loading " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            try{
                const auto& rDHS = toks[0];
                if(bib::in(rDHS, rDhsToChr_)){
                    std::string chrom = rDhsToChr_.at(toks[0]);
                    chromToLines[chrom].push_back(p);
                }
            } catch(...){
                std::cerr << "ERROR: missing '" << toks[0] << "' from " << inFnp << std::endl;
                throw std::runtime_error("missing rDHS");
            }
        }

        for(const auto& kv : chromToLines){
            const auto& chrom = kv.first;
            if(!bib::in(chrom, chroms_)){
                continue;
            }
            bfs::path outFnp = extras_ / chrom / "signal-output" / inFnp.filename();
            //std::cout << "about to write " << outFnp << std::endl;
            bfs::create_directories(outFnp.parent_path());
            bib::files::writeStrings(outFnp, kv.second);
        }
        std::cout << "finished " << inFnp << std::endl;
    }

    void splitBedFile(const bfs::path inFnp){
        std::unordered_map<std::string, std::vector<std::string>> chromToLines;
        std::cout << "loading " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            std::string chrom = toks[0];
            chromToLines[chrom].push_back(p);
        }

        for(const auto& kv : chromToLines){
            const auto& chrom = kv.first;
            if(!bib::in(chrom, chroms_)){
                continue;
            }
            bfs::path outFnp = extras_ / chrom / inFnp.filename();
            std::cout << "about to write " << outFnp << std::endl;
            bfs::create_directories(outFnp.parent_path());
            bib::files::writeStrings(outFnp, kv.second);
        }
    }

    void splitGeneFile(const bfs::path inFnp){
        std::unordered_map<std::string, std::vector<std::string>> chromToLines;
        std::cout << "loading " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            std::string chrom = accessionToChr_.at(toks[0]);
            chromToLines[chrom].push_back(p);
        }

        for(const auto& kv : chromToLines){
            const auto& chrom = kv.first;
            if(!bib::in(chrom, chroms_)){
                continue;
            }
            bfs::path outFnp = extras_ / chrom / inFnp.filename();
            std::cout << "about to write " << outFnp << std::endl;
            bfs::create_directories(outFnp.parent_path());
            bib::files::writeStrings(outFnp, kv.second);
        }
    }

    void splitTAD(const bfs::path inFnp){
        std::unordered_map<std::string, std::vector<std::string>> chromToLines;
        std::cout << "loading TAD " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            bib::string::rtrim(toks[0]);
            try{
                std::string chrom = rDhsToChr_.at(toks[0]);
                chromToLines[chrom].push_back(p);
            } catch(...){
                std::cerr << "ERROR: missing '" << toks[0] << "' from " << inFnp << std::endl;
                throw std::runtime_error("missing rDHS");
            }
        }

        for(const auto& kv : chromToLines){
            const auto& chrom = kv.first;
            if(!bib::in(chrom, chroms_)){
                continue;
            }
            bfs::path outFnp = extras_ / chrom / inFnp.filename();
            std::cout << "about to write " << outFnp << std::endl;
            bfs::create_directories(outFnp.parent_path());
            bib::files::writeStrings(outFnp, kv.second);
        }
    }

    void run(){
        zi::task_manager::simple tm(ZiARG_j);
        tm.start();

        if("hg19" == ZiARG_assembly){
            bfs::path inFnp = raw_ / FileNames::Tads;
            tm.insert(zi::run_fn(zi::bind(&Splitter::splitTAD,
                                          this, inFnp)));
        }

        for(const auto& fn : {FileNames::cREs}){
            bfs::path inFnp = raw_ / fn;
            tm.insert(zi::run_fn(zi::bind(&Splitter::splitBedFile,
                                          this, inFnp)));
        }

        for(const auto& fn : {FileNames::AllGenes, FileNames::PcGenes}){
            bfs::path inFnp = raw_ / fn;
            tm.insert(zi::run_fn(zi::bind(&Splitter::splitGeneFile,
                                          this, inFnp)));
        }

        if(1){
            auto dir = bib::files::dir(raw_ / "signal-output");
            const std::vector<bfs::path> fnps(dir.begin(), dir.end());
            std::cout << "found " << fnps.size() << " signal files\n";
            for(const auto& fnp : fnps){
                tm.insert(zi::run_fn(zi::bind(&Splitter::splitSignalFile,
                                              this, fnp)));
            }
        }
        tm.join();
    }
};

} // namespace bib
