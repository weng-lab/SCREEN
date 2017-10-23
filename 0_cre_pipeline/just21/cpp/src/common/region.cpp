#include <vector>
#include <string>
#include <fstream>
#include <cmath>
#include <iostream>
#include <cstdio>
#include <unordered_map>
#include <functional>

#include <boost/filesystem.hpp>
#include <boost/lexical_cast.hpp>

#include "cpp/files.hpp"
#include "cpp/string_utils.hpp"

#include "utils.hpp"
#include "lambda.hpp"
#include "region.hpp"
#include "rDHS.hpp"

namespace SCREEN {

  std::ostream& operator<<(std::ostream& s, const Region& r){
    s << r.start << '\t' << r.end;
    return  s;
  }

  bool operator <(const Region &a, const Region &b) {
    return std::tie(a.start, a.end) < std::tie(b.start, b.end);
  }

  bool operator >(const Region &a, const Region &b) {
    return std::tie(a.start, a.end) > std::tie(b.start, b.end);
  }

  bool operator ==(const Region &a, const Region &b) {
    return a.start == b.start && a.end == b.end;
  }

  template <typename T>
  std::vector<T>& GenericRegionSet<T>::operator [](const std::string& chr) {
    return regions_[chr];
  }
  template std::vector<Region> &GenericRegionSet<Region>::operator [](const std::string &chr);
  template std::vector<RegionWithScore> &GenericRegionSet<RegionWithScore>::operator [](const std::string &chr);
  
  template <typename T>
  const std::vector<std::string> &GenericRegionSet<T>::sorted_keys() const {
    return sorted_keys_;
  }
  template const std::vector<std::string> &GenericRegionSet<Region>::sorted_keys() const;
  template const std::vector<std::string> &GenericRegionSet<RegionWithScore>::sorted_keys() const;

  template <typename T>
  void GenericRegionSet<T>::unique() {
    sort();
    for (auto &k : regions_) {
      auto it = std::unique(k.second.begin(), k.second.end());
      k.second.resize(std::distance(k.second.begin(), it));
    }
  }
  template void GenericRegionSet<Region>::unique();
  template void GenericRegionSet<RegionWithScore>::unique();
  
  template <typename T>
  void GenericRegionSet<T>::expandPeaks(size_t halfwidth) {
    for (auto &k : regions_) {
      for (auto i = 0; i < k.second.size(); ++i) {
	int32_t start = k.second[i].start - halfwidth;
	int32_t end = k.second[i].end + halfwidth;
	if (start < 0) { start = 0; }
	k.second[i] = { start, end };
      }
    }
  }
  template void GenericRegionSet<Region>::expandPeaks(size_t halfwidth);
  template void GenericRegionSet<RegionWithScore>::expandPeaks(size_t halfwidth);
  
  template <typename T>
  void GenericRegionSet<T>::expandPeaks(size_t halfwidth, ChrLengths &chromInfo) {
    for (auto &k : regions_) {
      for (auto i = 0; i < k.second.size(); ++i) {
	int32_t start = k.second[i].start - halfwidth;
	int32_t end = k.second[i].end + halfwidth;
	if (start < 0) { start = 0; }
	if (chromInfo.find(k.first) != chromInfo.end()
	    && end > chromInfo[k.first]) {
	  end = chromInfo[k.first];
	}
	k.second[i] = { start, end };
      }
    }
  }
  template void GenericRegionSet<Region>::expandPeaks(size_t halfwidth, ChrLengths &chromInfo);
  template void GenericRegionSet<RegionWithScore>::expandPeaks(size_t halfwidth, ChrLengths &chromInfo);

  template <typename T>
  size_t GenericRegionSet<T>::find(const std::string &chr, const T &r) {
    auto end = regions_[chr].end(), begin = regions_[chr].begin();
    auto i = std::lower_bound(begin, end, r);
    if (i != end && !(r < *i)) { return i - begin; }
    return regions_[chr].size();
  }
  template size_t GenericRegionSet<Region>::find(const std::string &chr, const Region &r);
  template size_t GenericRegionSet<RegionWithScore>::find(const std::string &chr, const RegionWithScore &r);

  template <typename T>
  void GenericRegionSet<T>::update_keys() {
    sorted_keys_.clear();
    for (auto &k : regions_) { sorted_keys_.push_back(k.first); }
    std::sort(sorted_keys_.begin(), sorted_keys_.end());
  }
  template void GenericRegionSet<Region>::update_keys();
  template void GenericRegionSet<RegionWithScore>::update_keys();

  template <typename T>
  void GenericRegionSet<T>::appendGenericRegionSet(const GenericRegionSet<T>& r) {
    for (const auto& k : r.regions_) {
      regions_[k.first].insert(regions_[k.first].end(),
			       k.second.begin(),
			       k.second.end());
    }
    update_keys();
  }
  template void GenericRegionSet<Region>::appendGenericRegionSet(const GenericRegionSet<Region> &r);
  template void GenericRegionSet<RegionWithScore>::appendGenericRegionSet(const GenericRegionSet<RegionWithScore> &r);

  template <typename T>
  void GenericRegionSet<T>::write(const boost::filesystem::path &path) {
    std::ofstream o(path.string());
    for (const auto &k : sorted_keys_) {
      for (const auto &n : regions_[k]) {
	o << k << '\t' << n << '\n';
      }
    }
  }
  template void GenericRegionSet<Region>::write(const boost::filesystem::path &path);
  template void GenericRegionSet<RegionWithScore>::write(const boost::filesystem::path &path);

  template <typename T>
  size_t GenericRegionSet<T>::total() {
    size_t ret = 0;
    for (const auto& k : regions_) {
      ret += k.second.size();
    }
    return ret;
  }
  template size_t GenericRegionSet<Region>::total();
  template size_t GenericRegionSet<RegionWithScore>::total();

  /**
      sorts the regions contained in the object (modifies existing vector)
   */
  template <typename T>
  void GenericRegionSet<T>::sort() {
    for (auto& k : regions_) {
      std::sort(k.second.begin(), k.second.end());
    }
  }
  template void GenericRegionSet<Region>::sort();
  template void GenericRegionSet<RegionWithScore>::sort();

  /**
      appends a list of regions from a file; calls filter() to filter lines
      @param path: path to the file
      @param filter: lambda operating on each line, split on '\t'; true return value retains the line
   */
  void RegionSet::appendFile(const bfs::path& path, RegionFilter &filter) {
    const auto lines = bib::files::readStrings(path);
    for (const auto& line : lines) {
      std::vector<std::string> v = bib::string::split(line, '\t');
      if (filter(v)) {
	regions_.regions_[v[0]].push_back({ std::stoi(v[1]), std::stoi(v[2]) });
      }
    }
    regions_.update_keys();
  }

  /**
     appends a list of regions from a file; applies no filter
     @param path: path to the file
   */
  void RegionSet::appendFile(const bfs::path &path) {
    std::ifstream f(path.string());
    std::string line;
    while (std::getline(f, line)) {
      std::vector<std::string> v = bib::string::split(line, '\t');
      regions_.regions_[v[0]].push_back({ std::stoi(v[1]), std::stoi(v[2]) });
    }
    regions_.update_keys();
  }

} // SCREEN
