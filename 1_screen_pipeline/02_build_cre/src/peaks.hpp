#pragma once

#include "peak.hpp"

namespace bib {
  
  class Peaks : public std::unordered_map<std::string, Peak> {
    std::vector<std::string> accessions_;

  public:
    void setAccessions() {
      accessions_.clear();
      accessions_.reserve(size());
      for(auto& kv : *this){
	accessions_.push_back(kv.first);
      }
      zi::sort(accessions_.begin(), accessions_.end());
    }

    const auto& accessions() const { return accessions_; }
  };

} // namespace bib
