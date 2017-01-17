#pragma once

namespace bib {

namespace bfs = boost::filesystem;

struct RankDNase {
    std::string accession_;
    std::string bigwig_;
    int32_t rank_;
    float signal_;
    float zscore_;

    Json::Value toJson() const {
        Json::Value r;
        r["accession"] = accession_;
        r["bigwig"] = bigwig_;
        r["rank"] = rank_;
        r["signal"] = signal_;
        r["z-score"] = zscore_;
        return r;
    }

    friend auto& operator<<(std::ostream& s, const RankDNase& r){
        s << r.accession_ << " " << r.bigwig_ << " " << r.rank_
          << " " << r.signal_ << " " << r.zscore_;
        return s;
    }
};

struct RankConservation {
    int32_t rank_;
    float signal_;

    Json::Value toJson() const {
        Json::Value r;
        r["rank"] = rank_;
        r["signal"] = signal_;
        return r;
    }

    friend auto& operator<<(std::ostream& s, const RankConservation& r){
        s << r.rank_ << " " << r.signal_;
        return s;
    }
};

struct RankSimple {
    std::string accession_;
    std::string bigwig_;
    float signal_;
    float zscore_;
    bool only_ = true;

    Json::Value toJson() const {
        Json::Value r;
        r["accession"] = accession_;
        r["bigwig"] = bigwig_;
        if(only_){
            r["signal"] = signal_;
        } else {
            r["zscore"] = zscore_;
        }
        return r;
    }

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

    Json::Value toJson() const {
        Json::Value r;
        r["rank"] = rank_;
        r["z-score"] = zscore_;
        for(const auto& kv : parts_){
            r[kv.first] =  kv.second.toJson();
        }
        return r;
    }

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

    Json::Value toJson() const {
        Json::Value r;
        for(const auto& kv : rankTypeToRank_){
            r[kv.first] =  kv.second.toJson();
        }
        return r;
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
