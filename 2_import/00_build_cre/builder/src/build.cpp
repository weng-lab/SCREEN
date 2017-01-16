#include "helpers.hpp"

#include <zi/zargs/zargs.hpp>
ZiARG_string(chr, "", "chrom to load");
ZiARG_string(assembly, "mm10", "assembly");
ZiARG_bool(first, false, "show first line");
ZiARG_bool(split, false, "split up files");
ZiARG_int32(j, 5, "num threads");

namespace bib {

template <typename T>
class Builder {
    T paths_;

    Peaks peaks_; // map of peaks by accession

public:
    Builder(const T& paths)
        : paths_(paths)
    {}

    void build(){
        DataHelper d(paths_, peaks_);

        const auto& accessions = peaks_.accessions();

        std::cout << "merging genes and signals into peaks...\n";
#pragma omp parallel for
        for(size_t i = 0; i < accessions.size(); ++i){
            const auto& accession = accessions[i];
            Peak& p = peaks_[accession];
            processPeak(d, p);
        }

        if(0){
            const std::string a = "EE0022963";
            if(bib::in(a, peaks_)){
                Peak& p = peaks_[a];
                if(0){
                    std::cout << p << std::endl;
                }else {
                    Json::StyledWriter styledWriter;
                    std::cout << styledWriter.write(p.toJson());
                }
            }
        }
    }

    void processPeak(const DataHelper& d, Peak& p){
        const std::string& mpName = p.mpName;
        p.genome = paths_.genome_;

        d.setAllGenes(mpName, p.gene_nearest_all);
        d.setPcGenes(mpName, p.gene_nearest_pc);

        d.setDNaseRanks(p);
        d.setCTCFRanks(p);
        d.setEnhancerRanks(p);
        d.setPromoterRanks(p);
        d.setConservationRanks(p);
    }

    void dumpToJson(bfs::path d){
        const auto& accessions = peaks_.accessions();
        bfs::path fnp = d / ("parsed." + paths_.chr_ + ".json");

        std::vector<std::string> lsj(accessions.size());

        std::cout << "dumping to JSON...\n";
        {
            TicToc tt("dump to JSON strings");
#pragma omp parallel for
            for(size_t i = 0; i < accessions.size(); ++i){
                const auto& accession = accessions[i];
                Peak& p = peaks_[accession];
                Json::FastWriter fastWriter;
                lsj[i] = fastWriter.write(p.toJson());
            }
        }

        {
            TicToc tt("write to file");
            std::ofstream out(fnp.string(), std::ios::out | std::ios::trunc);
            for(const auto& j : lsj){
                out << j;
            }
        }

        std::cout << "\twrote " << fnp << " " << lsj.size() << std::endl;
    }

    void dumpToTsv(bfs::path d){
        const auto& accessions = peaks_.accessions();

        std::vector<std::string> tsv(accessions.size());

        std::cout << "dumping to TSV...\n";
        {
            TicToc tt("dump to TSV strings");
#pragma omp parallel for
            for(size_t i = 0; i < accessions.size(); ++i){
                const auto& accession = accessions[i];
                Peak& p = peaks_[accession];
                tsv[i] = p.toTsv();
            }
        }

        {
            bfs::path fnp = d / ("parsed.headers." + paths_.chr_ + ".tsv");
            TicToc tt("write to " + fnp.string());
            {
                std::ofstream out(fnp.string(), std::ios::out | std::ios::trunc);
                std::vector<std::string> header {"accession",
                        "mpName", "negLogP", "chrom", "start", "end",
                        "conservation_rank", "conservation_signal",
                        "dnase_rank", "dnase_signal", "dnase_zscore",
                        "ctcf_only_rank", "ctcf_only_zscore",
                        "ctcf_dnase_rank", "ctcf_dnase_zscore",
                        "h3k27ac_only_rank", "h3k27ac_only_zscore",
                        "h3k27ac_dnase_rank", "h3k27ac_dnase_zscore",
                        "h3k4me3_only_rank", "h3k4me3_only_zscore",
                        "h3k4me3_dnase_rank", "h3k4me3_dnase_zscore",
                        "gene_all_distance", "gene_all_name",
                        "gene_pc_distance", "gene_pc_name"};
                out << bib::string::join(header, "\t") << "\n";
            }
            std::cout << "\twrote " << fnp << std::endl;
        }
        {
            bfs::path fnp = d / ("parsed." + paths_.chr_ + ".tsv");
            TicToc tt("write to " + fnp.string());
            {
                std::ofstream out(fnp.string(), std::ios::out | std::ios::trunc);
                for(const auto& j : tsv){
                    out << j;
                }
            }
            std::cout << "\twrote " << fnp << " " << tsv.size() << std::endl;
        }
    }
};

} // namespace bib

void runChrom(const std::string chrom, const bfs::path d){
    bib::HumanMousePaths paths(ZiARG_assembly, chrom, d);
    bib::Builder<bib::HumanMousePaths> b(paths);

    {
        bib::TicToc tt("build time");
        b.build();
    }
    {
        if(0){
            bib::TicToc tt("JSON dump time");
            b.dumpToJson(d);
        } else {
            bib::TicToc tt("tsv dump time");
            b.dumpToTsv(d);
        }
    }
}

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
            std::cout << mpToChr_["MP-3-100.000000"] << std::endl;
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

int main(int argc, char* argv[]){
    zi::parse_arguments(argc, argv, true);  // modifies argc and argv
    const auto args = std::vector<std::string>(argv + 1, argv + argc);

    const std::vector<std::string> hg19_chroms{"chr1", "chr2", "chr3", "chr4",
            "chr5", "chr6", "chr7", "chr8", "chr9", "chr10", "chr11", "chr12",
            "chr13", "chr14", "chr15", "chr16", "chr17", "chr18", "chr19",
            "chr20", "chr21", "chr22", "chrX", "chrY"};
    const std::vector<std::string> mm10_chroms{"chr1", "chr2", "chr3", "chr4",
            "chr5", "chr6", "chr7", "chr8", "chr9", "chr10", "chr11", "chr12",
            "chr13", "chr14", "chr15", "chr16", "chr17", "chr18", "chr19",
            "chrX", "chrY"};

    std::vector<std::string> chroms;
    if("hg19" == ZiARG_assembly){
        chroms = hg19_chroms;
    } else if("mm10" == ZiARG_assembly){
        chroms = mm10_chroms;
    } else {
        throw std::runtime_error("unknown assembly: " + ZiARG_assembly);
    }

    if(ZiARG_chr > ""){
        chroms = {ZiARG_chr};
    }

    bfs::path base =  "/project/umw_zhiping_weng/0_metadata/encyclopedia/";
    bfs::path d = base / "Version-4" / "ver9/" / ZiARG_assembly / "raw";

    if(ZiARG_split){
        Splitter s(d, chroms);
        s.run();
        return 0;
    }

    try {
        zi::task_manager::simple tm(ZiARG_j);
        tm.start();
        for(const auto& chrom : chroms){
            tm.insert(zi::run_fn(zi::bind(&runChrom, chrom, d)));
        }
        tm.join();

    } catch(const std::exception& ex){
        std::cerr << ex.what() << std::endl;
        return 1;
    }

    return 0;
}
