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
#include "cpp/gzstream.hpp"

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
  const std::string assembly_;
  const std::string gene_transcript_;
  const std::string typ_;
  
public:
  ReadJson(bfs::path fnp, std::string assembly, std::string gene_transcript, std::string typ)
        : fnp_(fnp)
	, assembly_(assembly)
	, gene_transcript_(gene_transcript)
	, typ_(typ)
    {}

    void parse(){
        Gzip_reader d(fnp_);

        bfs::path outFnp = fnp_.string() + ".csv.gz";
	GZSTREAM::ogzstream out(outFnp.string());

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

    void parseLine(GZSTREAM::ogzstream& out, Json::Value& root){
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
                    out << assembly_ << ','
			<< gene_transcript_ << ','
			<< typ_ << ','
			<< row << "\n";
                }
            }
        }
    }
};
} // namespace bib

int main(int argc, char* argv[]){
    zi::parse_arguments(argc, argv, true);  // modifies argc and argv
    const auto args = std::vector<std::string>(argv + 1, argv + argc);

    if(4 != args.size()){
        std::cerr << "expect 1 JSON file, assembly, gene/transcript, typ" << std::endl;
        return 1;
    }

    try {
      bib::ReadJson rs(args[0], args[1], args[2], args[3]);
        rs.parse();
    } catch(const std::exception& ex){
        std::cerr << ex.what() << std::endl;
        return 1;
    }

    return 0;
}
