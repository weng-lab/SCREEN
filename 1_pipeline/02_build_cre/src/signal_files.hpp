#pragma once

namespace bib {

class SignalFile {
    bfs::path fnp_;

public:
    SignalFile()
    {}

    SignalFile(const bfs::path fnp)
        : fnp_(fnp)
    {
    }
    std::unordered_map<std::string, float> lines_;

    void reserve(size_t s){
        lines_.reserve(s);
    }

    inline void setSignalLineOnly(const auto& toks){
        if(4 != toks.size()){
            throw std::runtime_error("wrong num toks");
        }
        // MP-2175312-100.000000  -0.08  0.95  635383
        // mpName                 zscore signal rank
        lines_[toks[0]] = std::stof(toks[1]);
    }

    inline void setSignalLineRankZscore(const auto& toks){
        if(5 != toks.size()){
            throw std::runtime_error("invalid num toks");
        }
        // MP-2175312-100.000000  -0.70  1060099  -0.08  -1.33
        // mpName                 avgZ   rank     leftZ  rightZ
        lines_[toks[0]] = std::stof(toks[1]);
    }
};

} // namespace bib
