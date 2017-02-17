#pragma once

namespace bib {

struct SignalLine {
    int32_t rank;
    float signal;
    float zscore;
};

class SignalFile {
    bfs::path fnp_;


public:
    SignalFile()
    {}

    SignalFile(const bfs::path fnp)
        : fnp_(fnp)
    {
    }
    std::unordered_map<std::string, SignalLine> lines_;

    void reserve(size_t s){
        lines_.reserve(s);
    }

    inline void setSignalLineOnly(const auto& toks){
        SignalLine s;
        if(4 != toks.size()){
            throw std::runtime_error("wrong num toks");
        }
        // MP-2175312-100.000000  -0.08  0.95  635383
        // mpName                 zscore signal rank
        s.zscore = std::stof(toks[1]);
        s.signal = std::stof(toks[2]);
        s.rank = std::stoi(toks[3]);
        lines_[toks[0]] = std::move(s);
    }

    inline void setSignalLineConservation(const auto& toks){
        SignalLine s;
        if(3 != toks.size()){
            throw std::runtime_error("wrong num toks");
        }
        // MP-1034943-3.371610     0.0183822       611359
        s.signal = std::stof(toks[1]);
        s.rank = std::stoi(toks[2]);
        lines_[toks[0]] = std::move(s);
    }

    inline void setSignalLineRankZscore(const auto& toks){
        SignalLine s;
        if(5 != toks.size()){
            throw std::runtime_error("invalid num toks");
        }
        // MP-2175312-100.000000  -0.70  1060099  -0.08  -1.33
        // mpName                 avgZ   rank     leftZ  rightZ
        s.zscore = std::stof(toks[1]);
        s.rank = std::stoi(toks[2]);
        lines_[toks[0]] = std::move(s);
    }
};

} // namespace bib
