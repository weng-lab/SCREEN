//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;

  struct RegionWithScore {
    uint32_t start;
    uint32_t end;
    float score;
  };
  std::ostream& operator<<(std::ostream& s, const RegionWithScore&);
  bool operator <(const RegionWithScore &a, const RegionWithScore &b);
  bool operator >(const RegionWithScore &a, const RegionWithScore &b);
  bool operator ==(const RegionWithScore &a, const RegionWithScore &b);

  bool operator <(const Region &a, const RegionWithScore &b);
  bool operator >(const Region &a, const RegionWithScore &b);
  bool operator ==(const Region &a, const RegionWithScore &b);

  bool operator <(const RegionWithScore &a, const Region &b);
  bool operator >(const RegionWithScore &a, const Region &b);
  bool operator ==(const RegionWithScore &a, const Region &b);
  
  class ScoredRegionSet {
  private:
    void _append(const bfs::path&, int);
    void _append(const bfs::path&, RegionFilter&, int);
  public:
    ScoredRegionSet() {}
    ScoredRegionSet(GenericRegionSet<RegionWithScore> &regions) : regions_(regions) {}
    ScoredRegionSet(RegionSet&, float);
    ScoredRegionSet(ScoredRegionSet&, float);

    GenericRegionSet<RegionWithScore> regions_;
    void append(const bfs::path&);
    void appendNarrowPeak(const bfs::path&);
    void appendNarrowPeak(const bfs::path&, RegionFilter&);
    void appendZ(const bfs::path&);
    void appendZ(const bfs::path&, RegionFilter&);
    void convertToZ(bool = false);
  };

  class rDHS {

  private:
    void _process(ScoredRegionSet&);

  public:
    rDHS();
    rDHS(const bfs::path&);
    rDHS(const std::vector<bfs::path>&);
    rDHS(ScoredRegionSet&);
    ScoredRegionSet regions_;
    size_t total();
    void write(const boost::filesystem::path&);
    void write(const std::string&);
    void expandPeaks(size_t, ChrLengths&);
    void expandPeaks(size_t);
    
  };

  extern template std::vector<RegionWithScore> &GenericRegionSet<RegionWithScore>::operator [](const std::string &chr);
  extern template const std::vector<std::string> &GenericRegionSet<RegionWithScore>::sorted_keys() const;
  extern template void GenericRegionSet<RegionWithScore>::unique();
  extern template void GenericRegionSet<RegionWithScore>::expandPeaks(size_t halfwidth);
  extern template void GenericRegionSet<RegionWithScore>::expandPeaks(size_t halfwidth, ChrLengths &chromInfo);
  extern template size_t GenericRegionSet<RegionWithScore>::find(const std::string &chr, const RegionWithScore &r);
  extern template void GenericRegionSet<RegionWithScore>::update_keys();
  extern template void GenericRegionSet<RegionWithScore>::appendGenericRegionSet(const GenericRegionSet<RegionWithScore> &r);
  extern template void GenericRegionSet<RegionWithScore>::write(const boost::filesystem::path &path);
  extern template size_t GenericRegionSet<RegionWithScore>::total();
  extern template void GenericRegionSet<RegionWithScore>::sort();
  
} // SCREEN
