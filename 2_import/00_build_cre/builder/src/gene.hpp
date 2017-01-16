#pragma once

namespace bib {

namespace bfs = boost::filesystem;

struct Gene {
    std::string name;
    uint32_t geneID;
    int32_t distance;

    Json::Value toJson() const {
        Json::Value r;
        r["distance"] = distance;
        r["gene-name"] = name;
        return r;
    }

    friend bool operator<(const Gene& a, const Gene& b){
        return std::tie(a.distance) <
            std::tie(b.distance);
    }

    friend auto& operator<<(std::ostream& s, const Gene& g){
        s << g.name << "\t" << g.distance;
        return s;
    }
};

} // namespace bib
