#include <vector>
#include <string>
#include <fstream>
#include <cmath>
#include <iostream>
#include <cstdio>
#include <unordered_map>

#include <boost/filesystem.hpp>

#include "../utils.hpp"
#include "region.hpp"

namespace SCREEN {
  
  std::string regionToString(const std::string& chr, region r) {
    return chr + "\t" + std::to_string(r.start) + "\t" + std::to_string(r.end);
  };

  RegionSet::RegionSet(std::unordered_map<std::string, std::vector<region>> regions) {
    regions_ = regions;
  }

  const std::vector<region>& RegionSet::operator [](std::string& chr) {
    return regions_[chr];
  }

  const std::unordered_map<std::string, std::vector<region>>& RegionSet::regions() const {
    return regions_;
  }
  
  void RegionSet::appendRegionSet(const RegionSet& r) {
    for (const auto& k : r.regions_) {
      regions_[k.first].insert(regions_[k.first].end(),
			       k.second.begin(),
			       k.second.end());
    }
  }

  void RegionSet::write(const bfs::path& path) {
    std::ofstream f(path.string());
    for (const auto& k : regions_) {
      for (const auto& n : k.second) {
	f << k.first << "\t" << n.start << "\t" << n.end << "\t" << n.score << "\n";
      }
    }
  }

  void RegionSet::write_binary(const std::string& chr, const bfs::path& binary_path) {
    size_t s = regions_[chr].size();
    FILE *f = fopen(binary_path.string().c_str(), "w");
    if (fwrite(&s, sizeof(size_t), 1, f) != 1
	|| fwrite(&regions_[chr][0], sizeof(region), s, f) != s) {
      // TODO: exception
    }
    fclose(f);
  }

  void RegionSet::read_binary(const std::string& chr, const bfs::path& binary_path) {
    size_t s;
    FILE *f = fopen(binary_path.string().c_str(), "r");
    if (fread(&s, sizeof(size_t), 1, f) != 1) {
      // TODO: exception
    }
    regions_[chr] = std::vector<region>(s);
    if (fread(&regions_[chr][0], sizeof(region), s, f) != s) {
      // TODO: exception
    }
    fclose(f);
  }

  size_t RegionSet::total() {
    size_t ret = 0;
    for (const auto& k : regions_) {
      ret += k.second.size();
    }
    return ret;
  }

  /**
      appends a list of regions from a narrowPeak file, filtered by Q-value
      @param path: path to the file
      @param qfilter: Q-value (-logQ must be in column 9) at which to filter rows; default 0.05
   */
  void RegionSet::appendNarrowPeak(const bfs::path& path, float qfilter) {
    appendNarrowPeak(path.string(), qfilter);
  }

  void RegionSet::appendNarrowPeak(const std::string& path, float qfilter) {
    _append(path, 6, qfilter);
  }

  /**
      appends a list of Z-scores from a file
      @param path: path to the file; Z-scores must be in column 5
   */
  void RegionSet::appendZ(const bfs::path& path) {
    appendZ(path.string());
  }

  void RegionSet::appendZ(const std::string& path) {
    _append(path, 4, 1.0);
  }

  /**
      append a list of regions from a bed file

      @param path: the path of the file to append
      @param scoreidx: index of each region's score within the tab-separated lines
      @param qfilter: if passed, Q-score threshold; Q-scores must be in column 9 of each line
   */
  void RegionSet::_append(const std::string& path, int scoreidx, float qfilter) {
    const float nlog = -std::log(qfilter);
    std::ifstream f(path);
    std::string line;
    while (std::getline(f, line)) {
      std::vector<std::string> v = split(line, '\t');
      if(qfilter < 1.0 && (v.size() < 9 || std::stof(v[8]) <= nlog)){
	// no Q-score or does not meet threshold
	continue;
      }
      const auto& chr = v[0];
      if(chr.size() > 5 || (chr.size() == 5 && chr[3] > 50 || chr[3] < 49)){
	// invalid chromosome
	continue;
      }
      regions_[chr].push_back({
	  std::stoi(v[1]), std::stoi(v[2]), std::stof(v[scoreidx])
      });
    }
  }

  /**
      sorts the regions contained in the object (modifies existing vector)
   */
  void RegionSet::sort() {
    for (auto& k : regions_) {
      std::sort(k.second.begin(), k.second.end(),
		[](const region& a, const region& b){
		  return std::tie(a.start, a.end) < std::tie(b.start, b.end);
		});
    }
  }

  /**
      clusters DHSs to make rDHS "master peaks"
      @param input: input vector of regions
      @param ret: vector to receive master peaks
   */
  void rDHS_cluster(const std::vector<region>& input, std::vector<region>& ret) {
    if (1 == input.size()) {
      ret.push_back(input[0]);
    }
    if(input.size() <= 1) {
      return;
    }
    region pmp = input[0]; // potential master peak
    std::vector<region> current, next;
    for (auto i = 0; i < input.size(); ++i) {
      const region& r = input[i];
      if (r.start < pmp.end) {
	if (r.score > pmp.score) {
	  pmp = r;
	}
	current.push_back(r);
      }
      if (r.start >= pmp.end || i == input.size() - 1) {
	ret.push_back(pmp);
	for (const region& c : current) {
	  if (c.end <= pmp.start) {
	    next.push_back(c);
	  }
	}
	rDHS_cluster(next, ret);
	next.clear();
	current.clear();
	if (r.start >= pmp.end && i == input.size() - 1) {
	  ret.push_back(r);
	} else {
	  current.push_back(r);
	  pmp = r;
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
    
    std::unordered_map<std::string, std::vector<region>> ret;
    int32_t total = 0;
    int32_t ktotal = 0;
    for (const auto& k : regions_) {
      rDHS_cluster(k.second, ret[k.first]);
      total += ret[k.first].size();
      ktotal += k.second.size();
    }
    std::cout << "total: " << ktotal << " in, " << total << " out\n";
    
    return RegionSet(ret);
  }

} // SCREEN
