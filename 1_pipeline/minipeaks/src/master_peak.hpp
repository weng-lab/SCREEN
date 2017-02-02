#pragma once

#include "gene.hpp"

namespace bib {

namespace bfs = boost::filesystem;

class MasterPeak {
public:
    std::string chrom;
    int32_t start;
    int32_t end;
    std::string mpName;
    std::string negLogP;
    std::string accession;
};


} // namespace bib
