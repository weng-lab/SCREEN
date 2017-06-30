#include <vector>
#include <string>
#include <fstream>
#include <cmath>
#include <iostream>
#include <cstdio>
#include <unordered_map>

#include <boost/filesystem.hpp>
#include <boost/filesystem/path.hpp>

#include "utils.hpp"
#include "region.hpp"

namespace SCREEN {
  
  std::string regionToString(const std::string &chr, struct region r) {
    return chr + "\t" + std::to_string(r.start) + "\t" + std::to_string(r.end);
  };

  RegionSet::RegionSet() {}

  RegionSet::RegionSet(std::unordered_map<std::string, std::vector<struct region>> regions) {
    regions_ = regions;
  }

  const std::vector<struct region> &RegionSet::operator [](std::string &chr) {
    return regions_[chr];
  }

  const std::unordered_map<std::string, std::vector<struct region>> &RegionSet::regions() const {
    return regions_;
  }
  
  const std::vector<std::string> &RegionSet::sorted_keys() const {
    return sorted_keys_;
  }

  void RegionSet::_update_keys() {
    sorted_keys_.clear();
    for (auto &k : regions_) { sorted_keys_.push_back(k.first); }
    std::sort(sorted_keys_.begin(), sorted_keys_.end());
  }

  void RegionSet::appendRegionSet(const RegionSet &r) {
    for (auto k : r.regions_) {
      if (regions_.find(k.first) == regions_.end()) { regions_[k.first] = std::vector<struct region>(); }
      regions_[k.first].insert(regions_[k.first].end(), k.second.begin(), k.second.end());
    }
    _update_keys();
  }

  void RegionSet::write(const boost::filesystem::path &path) {
    std::ofstream o(path.string());
    for (auto &k : sorted_keys_) {
      for (auto n : regions_[k]) {
	o << k << "\t" << n.start << "\t" << n.end << "\t" << n.score << "\n";
      }
    }
  }

  size_t RegionSet::total() {
    size_t retval = 0;
    for (auto k : regions_) { retval += k.second.size(); }
    return retval;
  }

  /**
      appends a list of regions from a narrowPeak file, filtered by Q-value
      @param path: path to the file
      @param qfilter: Q-value (-logQ must be in column 9) at which to filter rows; default 0.05
   */
  void RegionSet::appendNarrowPeak(const boost::filesystem::path &path, float qfilter) {
    appendNarrowPeak(path.string(), qfilter);
  }

  void RegionSet::appendNarrowPeak(const std::string &path, float qfilter) {
    _append(path, 6, qfilter);
  }

  /**
      appends a list of Z-scores from a file
      @param path: path to the file; Z-scores must be in column 5
   */
  void RegionSet::appendZ(const boost::filesystem::path &path) {
    appendZ(path.string());
  }

  void RegionSet::appendZ(const std::string &path) {
    _append(path, 4, 1.0);
  }

  /**
      append a list of regions from a bed file

      @param path: the path of the file to append
      @param scoreidx: index of each region's score within the tab-separated lines
      @param qfilter: if passed, Q-score threshold; Q-scores must be in column 9 of each line
   */
  void RegionSet::_append(const std::string &path, int scoreidx, float qfilter) {
    std::ifstream f(path);
    std::string line;
    float nlog = -std::log(qfilter);
    while (std::getline(f, line)) {
      std::vector<std::string> v = split(line, '\t');
      if ((qfilter < 1.0 && (v.size() < 9 || std::stof(v[8]) <= nlog)) // no Q-score or does not meet threshold
	  || v[0].length() > 5 || (v[0].length() == 5 && v[0][3] > 50 || v[0][3] < 49) // invalid chromosome
	 ) { continue; }
      if (regions_.find(v[0]) == regions_.end()) { regions_[v[0]] = std::vector<struct region>(); }
      regions_[v[0]].push_back({
	  std::stoi(v[1]), std::stoi(v[2]), std::stof(v[scoreidx])
      });
    }
    _update_keys();
  }

  /**
      sorts the regions contained in the object (modifies existing vector)
   */
  void RegionSet::sort() {
    for (auto &k : regions_) {
      std::sort(k.second.begin(), k.second.end(),
		[](const struct region &a, const struct region &b) -> bool { 
		  if (a.start != b.start) return a.start < b.start;
		  return a.end < b.end;
		});
    }
  }

  /**
      clusters DHSs to make rDHS "master peaks"
      @param input: input vector of regions
      @param retval: vector to receive master peaks
   */
  void rDHS_cluster(const std::vector<struct region> &input, std::vector<struct region> &retval) {
    if (input.size() == 1) { retval.push_back(input[0]); }
    if (input.size() <= 1) { return; }
    struct region cregion = input[0];
    std::vector<struct region> clist, nlist;
    for (auto i = 0; i < input.size(); ++i) {
      struct region r = input[i];
      if (r.start < cregion.end) {
	if (r.score > cregion.score) { cregion = r; }
	clist.push_back(r);
      }
      if (r.start >= cregion.end || i == input.size() - 1) {
	retval.push_back(cregion);
	for (struct region c : clist) {
	  if (c.end <= cregion.start) { nlist.push_back(c); }
	}
	rDHS_cluster(nlist, retval);
	nlist.clear();
	clist.clear();
	if (r.start >= cregion.end && i == input.size() - 1) {
	  retval.push_back(r);
	} else {
	  clist.push_back(r);
	  cregion = r;
	}
      }
    }
  }

  /**
     clusters the regions contained in the object to produce "master peaks"
     @returns: new RegionSet instance containing the master peaks, sorted
  */
  RegionSet RegionSet::rDHS_Cluster() {
    sort();
    std::unordered_map<std::string, std::vector<struct region>> retval;

    int total = 0, ktotal = 0;
    
    for (auto k : regions_) {
      retval[k.first] = std::vector<struct region>();
      rDHS_cluster(k.second, retval[k.first]);
      total += retval[k.first].size();
      ktotal += k.second.size();
    }
    std::cout << "total: " << ktotal << " in, " << total << " out\n";
    
    return RegionSet(retval);
  }

} // SCREEN
