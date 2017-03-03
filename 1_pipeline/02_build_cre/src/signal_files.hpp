#pragma once

namespace bib {

  class SignalFile {
    bfs::path fnp_;

  public:
    SignalFile()
    {}

    SignalFile(const bfs::path fnp)
      : fnp_(fnp)
    {}
    
    std::unordered_map<std::string, float> lines_;

    void reserve(size_t s){
      lines_.reserve(s);
    }

    inline void setSignalLine(const auto& toks){
      if(2 > toks.size()){
	throw std::runtime_error("wrong num toks");
      }
      lines_[toks[0]] = std::stof(toks[1]);
    }
  };

} // namespace bib
