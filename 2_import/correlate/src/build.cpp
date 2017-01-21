#define ARMA_64BIT_WORD
#include <armadillo>

#define likely(x) __builtin_expect ((x), 1)
#define unlikely(x) __builtin_expect ((x), 0)

#include <zi/zargs/zargs.hpp>
ZiARG_string(chr, "", "chrom to load");
ZiARG_string(assembly, "mm10", "assembly");
ZiARG_bool(first, false, "show first line");
ZiARG_bool(split, false, "split up files");
ZiARG_int32(j, 5, "num threads");

#include "helpers.hpp"
#include "splitter.hpp"
#include "geneIDer.hpp"

namespace bib {

namespace a = arma;

class Builder {
    const bfs::path d_;

    std::vector<bfs::path> files_;


public:
    Builder(const bfs::path d)
        :d_(d)
    {}

    void build(){
        loadFileNames();
        uint32_t numRows = numCREs();

        a::fmat m(numRows, files_.size());

        for(uint32_t i = 0; i < files_.size(); ++i){
            const auto& fnp = files_[i];
            std::cout << fnp << std::endl;
        }

    }

    uint32_t numCREs(){
        bfs::path fnp = d_ / "masterPeaks.bed";
        return bib::files::readStrings(fnp).size();
    }

    void loadFileNames(){
        bfs::path fnp = d_ / "H3K27ac-List.txt";

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

} // namespace bib

void run(const bfs::path base){
    bfs::path d =  base / "raw";
    bib::Builder b(d);

    {
        bib::TicToc tt("build time");
        b.build();
    }
    {
        bfs::path outD = base / "newway";
        bfs::create_directories(outD);
        bib::TicToc tt("tsv dump time");
        //b.dumpToTsv(outD);
    }
}


int main(int argc, char* argv[]){
    zi::parse_arguments(argc, argv, true);  // modifies argc and argv
    const auto args = std::vector<std::string>(argv + 1, argv + argc);

    bfs::path base= "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4";
    base /= "ver9";
    base /= ZiARG_assembly;

    run(base);

    return 0;
}
