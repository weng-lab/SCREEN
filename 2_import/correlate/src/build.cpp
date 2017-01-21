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

class Builder {
    const bfs::path d_;

public:
    Builder(const bfs::path d)
        :d_(d)
    {}

    void build(){
        bfs::path fnp = d_ / "H3K27ac-List.txt";

        auto lines = bib::files::readStrings(fnp);

        std::vector<bfs::path> files;

        for(const auto& p : lines){
            auto toks = bib::str::split(p, '\t');
            std::string expID = toks[0];
            std::string fileID = toks[1];

            bfs::path fn = expID + "-" + fileID + ".txt";
            bfs::path sfnp = d_ / "signal-output" / fn;

            if(!bfs::exists(fnp)){
                std::cout << "ERROR: missing " << sfnp << std::endl;
            }
            files.push_back(sfnp);
        }
        std::cout << "found " << files.size() << std::endl;
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
