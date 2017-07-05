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

  const std::vector<Region>& RegionSet::operator [](const std::string& chr) {
    return regions_[chr];
  }

  const std::vector<Region>& RegionSet::operator [](const std::string& chr) const {
    return regions_.at(chr);
  }

  const ChrToRegions& RegionSet::regions() const {
    return regions_;
  }
  
  const std::vector<std::string> &RegionSet::sorted_keys() const {
    return sorted_keys_;
  }

  void RegionSet::unique() {
    sort();
    for (auto &k : regions_) {
      auto it = std::unique(k.second.begin(), k.second.end());
      k.second.resize(std::distance(k.second.begin(), it));
    }
  }
  
  void RegionSet::expandPeaks(size_t halfwidth) {
    for (auto &k : regions_) {
      for (auto i = 0; i < k.second.size(); ++i) {
	uint32_t start = k.second[i].start - halfwidth;
	uint32_t end = k.second[i].end + halfwidth;
	k.second[i] = { start, end };
      }
    }
  }
  
  void RegionSet::expandPeaks(size_t halfwidth, ChrLengths &chromInfo) {
    for (auto &k : regions_) {
      for (auto i = 0; i < k.second.size(); ++i) {
	uint32_t start = k.second[i].start - halfwidth;
	uint32_t end = k.second[i].end + halfwidth;
	if (start < 0) { start = 0; }
	if (chromInfo.find(k.first) != chromInfo.end()
	    && end > chromInfo[k.first]) {
	  end = chromInfo[k.first];
	}
	k.second[i] = { start, end };
      }
    }
  }

  size_t RegionSet::find(const std::string &chr, const Region &r) {
    auto end = regions_[chr].end(), begin = regions_[chr].begin();
    auto i = std::lower_bound(begin, end, r);
    if (i != end && !(r < *i)) { return i - begin; }
    return regions_.size();
  }

  void RegionSet::_update_keys() {
    sorted_keys_.clear();
    for (auto &k : regions_) { sorted_keys_.push_back(k.first); }
    std::sort(sorted_keys_.begin(), sorted_keys_.end());
  }

  void RegionSet::appendRegionSet(const RegionSet& r) {
    for (const auto& k : r.regions_) {
      regions_[k.first].insert(regions_[k.first].end(),
			       k.second.begin(),
			       k.second.end());
    }
    _update_keys();
  }

  void RegionSet::write(const boost::filesystem::path &path) {
    std::ofstream o(path.string());
    for (const auto &k : sorted_keys_) {
      for (const auto &n : regions_[k]) {
	o << k << "\t" << n.start << "\t" << n.end << "\n";
      }
    }
  }

  size_t RegionSet::total() {
    size_t ret = 0;
    for (const auto& k : regions_) {
      ret += k.second.size();
    }
    return ret;
  }

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
	regions_[v[0]].push_back({ std::stoi(v[1]), std::stoi(v[2]) });
      }
    }
    _update_keys();
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
      regions_[v[0]].push_back({ std::stoi(v[1]), std::stoi(v[2]) });
    }
    _update_keys();
  }

  /**
      sorts the regions contained in the object (modifies existing vector)
   */
  void RegionSet::sort() {
    for (auto& k : regions_) {
      std::sort(k.second.begin(), k.second.end());
    }
    for (int i = 0; i < 10; ++i) std::cout << regions_["chr1"][i].start << "\t" << regions_["chr1"][i].end << "\n";
  }

} // SCREEN
