#pragma once

namespace bib {

struct SignalLineConservation {
    int32_t rank;
    float signal;
};

struct SignalLineOnly {
    int32_t rank;
    float signal;
    float zscore;
};

struct SignalLineRankZscore {
    int32_t rank;
    float zscore;
};

template <typename T>
class SignalFile {
    bfs::path fnp_;

    std::unordered_map<std::string, T> lines_;

public:
    SignalFile()
    {}

    SignalFile(const bfs::path fnp)
        : fnp_(fnp)
    {
    }

    void reserve(size_t s){
        lines_.reserve(s);
    }

    void setSignalLineOnly(const auto& toks){
        SignalLineOnly s;
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

    void setSignalLineConservation(const auto& toks){
        SignalLineConservation s;
        if(3 != toks.size()){
            throw std::runtime_error("wrong num toks");
        }
        // MP-1034943-3.371610     0.0183822       611359
        s.signal = std::stof(toks[1]);
        s.rank = std::stoi(toks[2]);
        lines_[toks[0]] = std::move(s);
    }

    void setSignalLineRankZscore(const auto& toks){
        SignalLineRankZscore s;
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
