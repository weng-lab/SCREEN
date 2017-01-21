#define ARMA_64BIT_WORD
#include <armadillo>

#define likely(x) __builtin_expect ((x), 1)
#define unlikely(x) __builtin_expect ((x), 0)

#include <zi/zargs/zargs.hpp>
ZiARG_string(chr, "", "chrom to load");
ZiARG_string(assembly, "", "assembly");
ZiARG_bool(first, false, "show first line");
ZiARG_bool(split, false, "split up files");
ZiARG_int32(j, 5, "num threads");

#include "helpers.hpp"
#include "splitter.hpp"
#include "geneIDer.hpp"

namespace bib {

namespace a = arma;

struct SignalFileInfo {
    std::string fn;
    uint32_t numCols;
    uint32_t zscoreColIdx;

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

    std::vector<bfs::path> files_;

public:
    Builder(const bfs::path base, std::string assembly, const SignalFileInfo& sfi)
        : base_(base)
        , assembly_(assembly)
        , sfi_(sfi)
    {
        d_ = base / "raw";
        matFnp_ = base_ / "mat" / (sfi_.fn + ".bin");
    }

    void run(){
        a::fmat m;
        if(bfs::exists(matFnp_)){
            std::cout << "loading " << matFnp_ << std::endl;
            m.load(matFnp_.string());
        } else {
            m = build();
        }

        if(0){
            for(size_t i = 1; i < m.n_cols; ++i){
                const auto c = a::cor(m.col(0), m.col(i));
            }
        }
    }

    a::fmat build(){
        loadFileNames();
        uint32_t numRows = numCREs();
        uint32_t numCols = files_.size();
        a::fmat m(numRows, numCols);

#pragma omp parallel for
        for(uint32_t i = 0; i < files_.size(); ++i){
            const auto& fnp = files_[i];
            if(0){
                std::cout << std::to_string(i) + " of " +
                    std::to_string(numCols) +
                    " " + fnp.string() + "\n";
            }
            auto lines = bib::files::readStrings(fnp);
            for(uint32_t j = 0; j < lines.size(); ++j){
                const auto& p = lines[j];
                auto toks = bib::str::split(p, '\t');
                if(4 != toks.size()){
                    throw std::runtime_error("wrong num cols " + fnp.string());
                }
                m.at(j, i) = std::stof(toks[1]); // zscore
            }
        }

        bfs::create_directories(matFnp_.parent_path());
        m.save(matFnp_.string());
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
            std::string expID = toks[0];
            std::string fileID = toks[1];

            bfs::path fn = expID + "-" + fileID + ".txt";
            bfs::path sfnp = d_ / "signal-output" / fn;

            if(!bfs::exists(fnp)){
                std::cout << "ERROR: missing " << sfnp << std::endl;
            }
            files_.push_back(sfnp);
        }
        std::cout << "found " << files_.size() << " files" << std::endl;
    }
};

void run(bfs::path base, std::string assembly){
    std::cout << assembly << std::endl;
    base /= assembly;

    std::vector<SignalFileInfo> sfis = {
        SignalFileInfo{"CTCF-List.txt", 4, 1},
        SignalFileInfo{"DNase-List.txt", 4, 1},
        SignalFileInfo{"Enhancer-List.txt", 4, 1},
        SignalFileInfo{"H3K27ac-List.txt", 4, 1},
        SignalFileInfo{"H3K4me3-List.txt", 4, 1},
        SignalFileInfo{"Insulator-List.txt", 4, 1},
        SignalFileInfo{"Promoter-List.txt", 4, 1}
    };

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

    for(const auto& assembly : {"mm10", "hg19"}){
        bib::run(base, assembly);
    }

    return 0;
}
