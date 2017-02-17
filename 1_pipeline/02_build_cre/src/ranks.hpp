#pragma once

namespace bib {

namespace bfs = boost::filesystem;

struct RankSimple {
    std::string accession_;
    std::string bigwig_;
    float signal_;
    float zscore_;
    bool only_ = true;

    friend auto& operator<<(std::ostream& s, const RankSimple& r){
        s << r.accession_ << " " << r.bigwig_ << " ";
        if(r.only_){
            s << "signal: " << r.signal_;
        } else {
            s << "zscore: " << r.zscore_;
        }
        return s;
    }
};

struct RankMulti {
    std::map<std::string, RankSimple> parts_;
    int32_t rank_;
    float zscore_;

    friend auto& operator<<(std::ostream& s, const RankMulti& rm){
        s << rm.rank_ << " " << rm.zscore_ << "\n";
        for(const auto& kv : rm.parts_){
            s << "\t\t\t\t" << kv.first << " " << kv.second << "\n";
        }
        return s;
    }
};

class RankContainer {
    std::map<std::string, RankMulti> rankTypeToRank_;

public:
    void add(std::string rankType, RankMulti& rm){
        rankTypeToRank_[rankType] = rm;
    }

    const auto& at(const std::string& k) const {
        return rankTypeToRank_.at(k);
    }

    const bool has(const std::string& k) const {
        return bib::in(k, rankTypeToRank_);
    }

    friend auto& operator<<(std::ostream& s, const RankContainer& rm){
        for(const auto& kv : rm.rankTypeToRank_){
            s << "\t\t\t" << kv.first << "\t" << kv.second << "\n";
        }
        return s;
    }
};

} // namespace bib
