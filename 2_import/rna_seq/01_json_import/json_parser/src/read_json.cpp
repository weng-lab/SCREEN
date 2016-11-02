#include <boost/filesystem.hpp>
#include <boost/log/trivial.hpp>
#include <boost/log/utility/setup.hpp>

#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <algorithm>
#include <json/json.h>
#include <json/reader.h>

#include "cpp/utility.hpp"
#include "cpp/gzip_reader.hpp"

#include <zi/zargs/zargs.hpp>
ZiARG_string(file, "", "file to load");
ZiARG_bool(first, false, "show first line");

namespace bib {

namespace bfs = boost::filesystem;

struct DBrow {
    std::string ensembl_id;
    std::string gene_name;
    std::string dataset;
    int rep;
    float fpkm;
    float tpm;

    friend std::ostream& operator<<(std::ostream& s, const DBrow& r){
        s << r.ensembl_id << "," << r.gene_name << ","
          << r.dataset << "," << r.rep << ","
          << r.fpkm << "," << r.tpm;
        return s;
    }
};

class ReadJson{
    const bfs::path fnp_;

public:
    ReadJson(bfs::path fnp)
        : fnp_(fnp)
    {}

    void parse(){
        Gzip_reader d(fnp_);

        bfs::path outFnp = fnp_.string() + ".csv";
        std::ofstream out(outFnp.string());
        if(!out.is_open()){
            throw std::runtime_error("could not open " + outFnp.string());
        }

        size_t fileLineCount = 0;
        size_t parsedRows = 0;
        for(std::string line; d.getline(line);){
            ++fileLineCount;
            Json::Value root;
            Json::Reader reader;
            if (!reader.parse(line, root, false)) {
                std::cerr << reader.getFormattedErrorMessages() << std::endl;
                std::cerr << line << std::endl;
                std::cerr << fileLineCount - 1 << std::endl;
                continue;
            }

            if(ZiARG_first){
                std::cout << root << std::endl;
                return;
            }

            parseLine(out, root);
            ++parsedRows;
        }

        out.close();
        std::cout << "parsed " << parsedRows << " rows" << std::endl;
        std::cout << "wrote: " << outFnp << std::endl;
    }

    void parseLine(std::ofstream& out, Json::Value& root){
        std::string ensembl_id = root["ensembl_id"].asString();
        std::string gene_name = root["gene_name"].asString();

        for(const auto& n : root["expression_values"]){
            std::string dataset;
            std::map<int, std::map<std::string, float>> vals;
            for(const auto e : n.getMemberNames()){
                if("dataset" == e){
                    dataset = n[e].asString();
                    continue;
                }
                if(!("rep" == e.substr(0, 3))){
                    std::cout << "unknown " << e << "\n";
                    std::exit(1);
                }
                auto toks = bib::str::split(e, '_');
                int8_t repNum = toks[0][3] - '0';
                vals[repNum][toks[1]] = n[e].asFloat();
            }

            for(const auto& repVals : vals){
                int8_t rep = repVals.first;
                float fpkm = repVals.second.at("fpkm");
                float tpm = repVals.second.at("tpm");
                if(fpkm > 0 || tpm > 0){
                    DBrow row = {.ensembl_id = ensembl_id,
                                 .gene_name = gene_name,
                                 .dataset = dataset,
                                 .rep = rep,
                                 .fpkm = fpkm,
                                 .tpm = tpm};
                    out << row << "\n";
                }
            }
        }
    }
};
} // namespace bib

int main(int argc, char* argv[]){
    zi::parse_arguments(argc, argv, true);  // modifies argc and argv
    const auto args = std::vector<std::string>(argv + 1, argv + argc);

    if(1 != args.size()){
        std::cerr << "expect 1 JSON file" << std::endl;
        return 1;
    }

    try {
        bib::ReadJson rs(args[0]);
        rs.parse();
    } catch(const std::exception& ex){
        std::cerr << ex.what() << std::endl;
        return 1;
    }

    return 0;
}
