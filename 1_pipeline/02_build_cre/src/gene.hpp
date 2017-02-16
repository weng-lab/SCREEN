#pragma once

namespace bib {

namespace bfs = boost::filesystem;

struct Gene {
    uint32_t geneID;
    int32_t distance;

    friend bool operator<(const Gene& a, const Gene& b){
        return std::tie(a.distance) <
            std::tie(b.distance);
    }

    friend auto& operator<<(std::ostream& s, const Gene& g){
        s << g.geneID << "\t" << g.distance;
        return s;
    }
};

} // namespace bib
