//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

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

    inline void setSignalLine(const auto& toks, const uint32_t dataColNum){
      if(toks.size() < 2){
	std::cerr << "WARNING: bib::SignalFile::setSignalLine: expected >= 2 tokens, got " << toks.size() << "\n";
        return;
	throw std::runtime_error("bib::SignalFile::setSignalLine: wrong number of tokens");
      }
      lines_[toks[0]] = std::stof(toks[dataColNum]);
    }
  };

} // namespace bib
