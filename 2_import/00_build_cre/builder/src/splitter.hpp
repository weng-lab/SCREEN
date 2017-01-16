#pragma once

class Splitter {
    const bfs::path d_;
    const std::vector<std::string>& chroms_;
    std::unordered_map<std::string, std::string> mpToChr_;

public:
    Splitter(const bfs::path d,
             const std::vector<std::string>& chroms)
        : d_(d)
        , chroms_(chroms)
    {
        loadMasterPeaks();
    }

    void loadMasterPeaks(){
        bfs::path inFnp = d_ / "masterPeaks.bed";

        std::cout << "loading peaks " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);

        mpToChr_.reserve(3000000);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            mpToChr_[toks[3]] = toks[0];
        }
        std::cout << "\tfound " << mpToChr_.size() << " peaks\n";
        if("mm10" == ZiARG_assembly){
            std::cout << mpToChr_.at("MP-3-100.000000") << std::endl;
        }
    }

    void splitSignalFile(const bfs::path inFnp){
        std::unordered_map<std::string, std::vector<std::string>> chromToLines;
        std::cout << "loading peaks " << inFnp << std::endl;
        auto lines = bib::files::readStrings(inFnp);
        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            try{
                std::string chrom = mpToChr_.at(toks[0]);
                chromToLines[chrom].push_back(p);
            } catch(...){
                std::cerr << "ERROR: missing " << toks[0] << " from " << inFnp << std::endl;
            }
        }

        for(const auto& kv : chromToLines){
            const auto& chrom = kv.first;
            if(!bib::in(chrom, chroms_)){
                continue;
            }
            bfs::path outFnp = d_ / chrom / "signal-output" / inFnp.filename();
            std::cout << "about to write " << outFnp << std::endl;
            bfs::create_directories(outFnp.parent_path());
            bib::files::writeStrings(outFnp, kv.second);
        }
    }

    void splitBedFile(const bfs::path inFnp){
        std::unordered_map<std::string, std::vector<std::string>> chromToLines;
        std::cout << "loading bed " << inFnp << std::endl;
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
            bfs::path outFnp = d_ / chrom / inFnp.filename();
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
            try{
                std::string chrom = mpToChr_.at(toks[0]);
                chromToLines[chrom].push_back(p);
            } catch(...){
                std::cerr << "ERROR: missing " << toks[0] << " from " << inFnp << std::endl;
            }
        }

        for(const auto& kv : chromToLines){
            const auto& chrom = kv.first;
            if(!bib::in(chrom, chroms_)){
                continue;
            }
            bfs::path outFnp = d_ / chrom / inFnp.filename();
            std::cout << "about to write " << outFnp << std::endl;
            bfs::create_directories(outFnp.parent_path());
            bib::files::writeStrings(outFnp, kv.second);
        }
    }

    void run(){
        zi::task_manager::simple tm(ZiARG_j);
        tm.start();

        if("hg19" == ZiARG_assembly){
            bfs::path inFnp = d_ / "TADs.txt";
            tm.insert(zi::run_fn(zi::bind(&Splitter::splitTAD,
                                          this, inFnp)));
        }

        for(const auto& fn : {"AllGenes.bed", "PCGenes.bed", "masterPeaks.bed"}){
            bfs::path inFnp = d_ / fn;
            tm.insert(zi::run_fn(zi::bind(&Splitter::splitBedFile,
                                          this, inFnp)));
        }

        auto dir = bib::files::dir(d_ / "signal-output");
        const std::vector<bfs::path> fnps(dir.begin(), dir.end());
        std::cout << "found " << fnps.size() << " signal files\n";
        for(const auto& fnp : fnps){
            tm.insert(zi::run_fn(zi::bind(&Splitter::splitSignalFile,
                                          this, fnp)));
        }
        tm.join();
    }
};
