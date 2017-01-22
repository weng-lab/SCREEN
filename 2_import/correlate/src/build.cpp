#define ARMA_64BIT_WORD
#include <armadillo>

#define likely(x) __builtin_expect ((x), 1)
#define unlikely(x) __builtin_expect ((x), 0)

#include <iomanip>
#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <algorithm>
#include <mutex>

#include <json/json.h>
#include <json/reader.h>
#include <boost/optional.hpp>
#include <boost/filesystem.hpp>
#include <boost/log/trivial.hpp>
#include <boost/log/utility/setup.hpp>

#include <zi/concurrency/concurrency.hpp>
#include <zi/parallel/algorithm.hpp>
#include <zi/parallel/numeric.hpp>

#include "cpp/utility.hpp"
#include "cpp/string_utils.hpp"
#include "cpp/files.hpp"
#include "cpp/gzip_reader.hpp"
#include "cpp/tictoc.hpp"

#include <zi/zargs/zargs.hpp>
ZiARG_string(chr, "", "chrom to load");
ZiARG_string(assembly, "", "assembly");
ZiARG_bool(first, false, "show first line");
ZiARG_bool(split, false, "split up files");
ZiARG_int32(j, 5, "num threads");

namespace bib {

namespace a = arma;

struct SignalFileInfo {
    std::string fn;
    uint32_t numDatasetCols;
    uint32_t numSignalCols;

    friend auto& operator<<(std::ostream& s, const SignalFileInfo& e){
        s << e.fn;
        return s;
    }
};

class Builder {
    const bfs::path base_;
    const std::string assembly_;
    SignalFileInfo sfi_;
    bfs::path d_;
    bfs::path matFnp_;
    bfs::path corFnp_;

    std::vector<bfs::path> files_;

private:

  void WriteMatrix(const a::fmat c) {
    std::ofstream _file;
    _file.open(corFnp_.string(), std::ios::out);
    _file << c << "\n";
    _file.close();
    setGroupWrite(corFnp_);
  }

    void setGroupWrite(bfs::path fnp){
        bfs::permissions(fnp, bfs::add_perms | bfs::owner_write | bfs::group_write);
    }

public:
    Builder(const bfs::path base, std::string assembly, const SignalFileInfo& sfi)
        : base_(base)
        , assembly_(assembly)
        , sfi_(sfi)
    {
        d_ = base / "raw";
        matFnp_ = base_ / "mat" / (sfi_.fn + ".bin");
        corFnp_ = base_ / "mat" / (sfi_.fn + ".cormat.txt");
    }

    void run(){
        a::fmat m;

        if(!bfs::exists(matFnp_)){
            m = build();
        } else {
            std::cout << "loading " << matFnp_ << std::endl;
            m.load(matFnp_.string());
        }

        if(m.has_nan()){
            std::cerr << "WARNING: NANs present in input matrix" << std::endl;
        }

        std::cout << "correlating" << std::endl;
        const a::fmat c = a::cor(m);

        if(c.has_nan()){
            std::cerr << "WARNING: NANs present in corr matrix" << std::endl;
        }

        WriteMatrix(c);
        std::cout << "saved correlated matrix to " << corFnp_.string() << std::endl;
    }

    a::fmat build(){
        loadFileNames();
        uint32_t numRows = numCREs();
        uint32_t numCols = files_.size();
        a::fmat m(numRows, numCols, a::fill::zeros);

#pragma omp parallel for
        for(uint32_t i = 0; i < files_.size(); ++i){
            const auto& fnp = files_[i];
            if(1){
                std::cout << std::to_string(i) + " of " +
                    std::to_string(numCols) +
                    " " + fnp.string() + "\n";
            }
            auto lines = bib::files::readStrings(fnp);
            for(uint32_t j = 0; j < lines.size(); ++j){
                const auto& p = lines[j];
                auto toks = bib::str::split(p, '\t');
                if(toks.size() < 2){
                    std::string err = "wrong num cols " + fnp.string()
                        + " expected " + std::to_string(sfi_.numSignalCols)
                        + "but got " + std::to_string(toks.size()) + "\n"
                        + "line was: " + p + "\n";
                    throw std::runtime_error(err);
                }
                if(0 && toks.size() != sfi_.numSignalCols){
                    std::string err = "wrong num cols " + fnp.string()
                        + " expected " + std::to_string(sfi_.numSignalCols)
                        + "but got " + std::to_string(toks.size()) + "\n"
                        + "line was: " + p + "\n";
                    std::cout << err;
                }

                m.at(j, i) = std::stof(toks[1]); // zscore
            }
        }

        bfs::create_directories(matFnp_.parent_path());
        if(bfs::exists(matFnp_)){
            std::cout << "removing old " << matFnp_ << std::endl;
            bfs::remove(matFnp_);
        }
        m.save(matFnp_.string());
        setGroupWrite(matFnp_);
        std::cout << "wrote " << matFnp_ << std::endl;
        return m;
    }

    uint32_t numCREs(){
        bfs::path fnp = d_ / "masterPeaks.bed";
        return bib::files::readStrings(fnp).size();
    }

    void loadFileNames(){
        bfs::path fnp = d_ / sfi_.fn;

        auto lines = bib::files::readStrings(fnp);

        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            bfs::path fn;

            if(3 == sfi_.numDatasetCols){
                if(3 != toks.size()){
                    std::cerr << "num toks found: " << toks.size() << std::endl;
                    throw std::runtime_error("3 is wrong num cols " + fnp.string());
                }
                std::string expID = toks[0];
                std::string fileID = toks[1];
                fn = expID + "-" + fileID + ".txt";
            } else if(4 == sfi_.numDatasetCols){
                if(4 != toks.size()){
                    std::cerr << "num toks found: " << toks.size() << std::endl;
                    throw std::runtime_error("4 is wrong num cols " + fnp.string());
                }
                std::string expID = toks[0];
                std::string fileID = toks[1];
                fn = expID + "-" + fileID + ".txt";
            } else if(5 == sfi_.numDatasetCols){
                if(5 != toks.size()){
                    std::cerr << "num toks found: " << toks.size() << std::endl;
                    throw std::runtime_error("5 is wrong num cols " + fnp.string());
                }
                std::string dnaseExpID = toks[0];
                std::string dnaseFileID = toks[1];
                std::string expID = toks[2];
                std::string fileID = toks[3];
                fn = dnaseExpID + "-" + dnaseFileID +"." +
                    expID + "-" + fileID + ".txt";
            } else {
                throw std::runtime_error("no file present");
            }

            bfs::path sfnp = d_ / "signal-output" / fn;

            if(bfs::exists(fnp) && bfs::is_regular_file(fnp)){
                files_.push_back(sfnp);
            } else {
                std::cerr << "ERROR: missing " << sfnp << std::endl;
            }
        }
        std::cout << "found " << files_.size() << " files" << std::endl;
    }
};

void run(bfs::path base, std::string assembly){
    std::cout << assembly << std::endl;
    base /= assembly;

    std::vector<SignalFileInfo> sfis;
    if("mm10" == assembly){
        sfis = {SignalFileInfo{"CTCF-List.txt", 3, 4},
                SignalFileInfo{"DNase-List.txt", 3, 4},
                SignalFileInfo{"Enhancer-List.txt", 5, 5},
                SignalFileInfo{"H3K27ac-List.txt", 3, 4},
                SignalFileInfo{"H3K4me3-List.txt", 3, 4},
                SignalFileInfo{"Insulator-List.txt", 5, 5},
                SignalFileInfo{"Promoter-List.txt", 5, 5}};
    } else if("hg19" == assembly){
        sfis = {SignalFileInfo{"CTCF-List.txt", 3, 4},
                SignalFileInfo{"DNase-List.txt", 4, 5},
                SignalFileInfo{"Enhancer-List.txt", 5, 5},
                SignalFileInfo{"H3K27ac-List.txt", 3, 4},
                SignalFileInfo{"H3K4me3-List.txt", 3, 4},
                SignalFileInfo{"Insulator-List.txt", 6, 6},
                SignalFileInfo{"Promoter-List.txt", 5, 5}};
    }

    if(0){ // for testing
        sfis = {
            SignalFileInfo{"DNase-List.txt", 4, 5},
        };
    }

    for(const auto& sfi : sfis){
        bib::Builder b(base, assembly, sfi);
        std::cout << sfi << std::endl;
        {
            bib::TicToc tt("build time");
            b.run();
        }
    }
}

} // namespace bib

int main(int argc, char* argv[]){
    zi::parse_arguments(argc, argv, true);  // modifies argc and argv
    const auto args = std::vector<std::string>(argv + 1, argv + argc);

    bfs::path base= "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4";
    base /= "ver9";

    std::vector<std::string> assemblies = {"hg19", "mm10"};
    if(ZiARG_assembly > ""){
        assemblies = {ZiARG_assembly};
    }

    for(const auto& assembly : assemblies){
        bib::run(base, assembly);
    }

    return 0;
}
