#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <cstdio>
#include <unordered_map>
#include <functional>
#include <cmath>

#include <boost/functional/hash.hpp>
#include <boost/filesystem.hpp>

#include "cpp/files.hpp"
#include "cpp/string_utils.hpp"

#include "lambda.hpp"
#include "utils.hpp"
#include "region.hpp"
#include "zscore.hpp"
#include "rDHS.hpp"

namespace SCREEN {

  std::ostream& operator<<(std::ostream &s, const RegionWithScore &r){
    s << r.start << '\t' << r.end << '\t' << r.score;
    return  s;
  }

  bool operator <(const RegionWithScore &a, const RegionWithScore &b) {
    return std::tie(a.start, a.end) < std::tie(b.start, b.end);
  }

  bool operator >(const RegionWithScore &a, const RegionWithScore &b) {
    return std::tie(a.start, a.end) > std::tie(b.start, b.end);
  }

  bool operator ==(const RegionWithScore &a, const RegionWithScore &b) {
    return a.start == b.start && a.end == b.end;
  }

  bool operator <(const RegionWithScore &a, const Region &b) {
    return std::tie(a.start, a.end) < std::tie(b.start, b.end);
  }

  bool operator >(const RegionWithScore &a, const Region &b) {
    return std::tie(a.start, a.end) > std::tie(b.start, b.end);
  }

  bool operator ==(const RegionWithScore &a, const Region &b) {
    return a.start == b.start && a.end == b.end;
  }

  bool operator <(const Region &a, const RegionWithScore &b) {
    return std::tie(a.start, a.end) < std::tie(b.start, b.end);
  }

  bool operator >(const Region &a, const RegionWithScore &b) {
    return std::tie(a.start, a.end) > std::tie(b.start, b.end);
  }

  bool operator ==(const Region &a, const RegionWithScore &b) {
    return a.start == b.start && a.end == b.end;
  }

  ScoredRegionSet::ScoredRegionSet(RegionSet &r, float score) {
    for (auto &kv : r.regions_.regions_) {
      regions_.regions_[kv.first] = std::vector<RegionWithScore>(r.regions_.regions_[kv.first].size());
      for (auto i = 0; i < r.regions_[kv.first].size(); ++i) {
	regions_.regions_[kv.first][i] = { r.regions_.regions_[kv.first][i].start, r.regions_.regions_[kv.first][i].end, score };
      }
    }
  }

  ScoredRegionSet::ScoredRegionSet(ScoredRegionSet &r, float score) {
    for (auto &kv : r.regions_.regions_) {
      regions_.regions_[kv.first] = std::vector<RegionWithScore>(r.regions_[kv.first].size());
      for (auto i = 0; i < r.regions_.regions_[kv.first].size(); ++i) {
	regions_.regions_[kv.first][i] = { r.regions_.regions_[kv.first][i].start, r.regions_.regions_[kv.first][i].end, score };
      }
    }
  }

  /**
     appends a list of regions from a file; calls filter() to filter lines
     @param path: path to the file
     @param filter: lambda operating on each line, split on '\t'; true return value retains the line
     @param scorefield: field containing the score for the region
  */
  void ScoredRegionSet::_append(const bfs::path& path, RegionFilter &filter, int scorefield) {
    const auto lines = bib::files::readStrings(path);
    for (const auto& line : lines) {
      std::vector<std::string> v = bib::string::split(line, '\t');
      if (filter(v)) {
	regions_.regions_[v[0]].push_back({ std::stoi(v[1]), std::stoi(v[2]), std::stof(v[scorefield]) });
      }
    }
    regions_.update_keys();
  }

  /**
     appends a list of regions from a file; applies no filter
     @param path: path to the file
     @param scorefield: field containing the score for the region
  */
  void ScoredRegionSet::_append(const bfs::path &path, int scorefield) {
    std::ifstream f(path.string());
    std::string line;
    while (std::getline(f, line)) {
      std::vector<std::string> v = bib::string::split(line, '\t');
      if (v.size() < scorefield + 1) {
	std::cout << "WARNING: less than " << (scorefield + 1) << " fields in line " << line << '\n';
	continue;
      }
      regions_.regions_[v[0]].push_back({ std::stoi(v[1]), std::stoi(v[2]), std::stof(v[scorefield]) });
    }
    regions_.update_keys();
  }
  

  /**
     appends a list of regions from a file; sets all scores to zero
     @param path: path to the file
  */
  void ScoredRegionSet::append(const bfs::path &path) {
    std::ifstream f(path.string());
    std::string line;
    while (std::getline(f, line)) {
      std::vector<std::string> v = bib::string::split(line, '\t');
      regions_.regions_[v[0]].push_back({ std::stoi(v[1]), std::stoi(v[2]), 0.0 });
    }
    regions_.update_keys();
  }

  void ScoredRegionSet::appendZ(const bfs::path &path) {
    _append(path, 4);
  }

  void ScoredRegionSet::appendZ(const bfs::path &path, RegionFilter &filter) {
    _append(path, filter, 4);
  }

  void ScoredRegionSet::appendNarrowPeak(const bfs::path &path) {
    _append(path, 6);
  }

  void ScoredRegionSet::appendNarrowPeak(const bfs::path &path, RegionFilter &filter) {
    _append(path, filter, 6);
  }

  /**
     converts the scores for each region to the corresponding Z-score
     @param uselog: if true, log transform scores before computing the Z-score
   */
  void ScoredRegionSet::convertToZ(bool uselog) {

    regions_.sort();
    std::vector<double> values, forcalc;

    // move scores to armadillo vector
    for (auto &chr : regions_.sorted_keys_) {
      for (auto &r : regions_[chr]) {
	if (!uselog || r.score > 0.0) {
	  forcalc.push_back(uselog ? std::log10(r.score) : r.score);
	  values.push_back(uselog ? std::log10(r.score + 0.01) : r.score);
	}
      }
    }

    // compute Z's
    std::cout << "found " << forcalc.size() << " values\n";
    a::vec Zc(forcalc.data(), forcalc.size(), false, true);
    a::vec Z(values.data(), values.size(), false, true);
    double mean = a::mean(Zc);
    double stdev = a::stddev(Zc);
    std::cout << "mean is " << mean << "; stdev is " << stdev << "\n";
    Zc = (Z - mean) / stdev;

    // move scores back to object
    uint64_t i = 0;
    for (auto &chr : regions_.sorted_keys_) {
      for (auto &r : regions_[chr]) {
	if (!uselog || r.score > 0.0) {
	  r = { r.start, r.end, Zc[i++] };
	} else {
	  r = { r.start, r.end, -10.0 };
	}
      }
    }
    
  }

  rDHS::rDHS() {}

  rDHS::rDHS(const bfs::path &rDHS_path) {
    regions_.append(rDHS_path);
  }

  /**
      clusters DHSs to make rDHS "master peaks"
      @param input: input vector of regions
      @param ret: vector to receive master peaks
   */
  void rDHS_cluster(std::vector<RegionWithScore> &input, std::vector<RegionWithScore> &ret) {

    //base cases: append singleton if present; no need to cluster one or zero regions
    if (1 == input.size()) { ret.push_back(input[0]); }
    if (input.size() <= 1) { return; }

    // set current candidate to first element
    RegionWithScore candidate = input[0];
    std::vector<RegionWithScore> current, next;

    // iterate through all regions
    for (auto i = 0; i < input.size(); ++i) {
      const RegionWithScore& r = input[i];

      // if this element overlaps the current candidate
      if (r.start < candidate.end) {
	if (r.score > candidate.score) { candidate = r; } // replace candidate if this element is better
	current.push_back(r); // append current element to working list regardless of score
      }

      // if the current element is beyond the candidate or is the last in the list...
      if (r.start >= candidate.end || i == input.size() - 1) {

	// append the current candidate to the return list of rDHSs
	ret.push_back(candidate);

	// find any elements from the working list  which do not overlap the newly-appended rDHS 
	for (const RegionWithScore& c : current) {
	  if (c.end <= candidate.start) { next.push_back(c); }
	}

	// recurse over any elements from the previous set which did not overlap the new rDHS
	rDHS_cluster(next, ret);

	// reset lists and candidate
	next.clear();
	current.clear();
	if (r.start >= candidate.end && i == input.size() - 1) {
	  ret.push_back(r); // if this is the last element, append it before returning
	} else {
	  current.push_back(r);
	  candidate = r;
	}
      }
    }

  }

  rDHS::rDHS(const std::vector<bfs::path>& zfile_list) {

    // load all Z-scores
    std::cout << "loading regions from " << zfile_list.size() << " files...\n";
    ScoredRegionSet r;
    for (const auto& fnp : zfile_list) {
      r.appendZ(fnp);
    }

    // create rDHSs
    _process(r);

  }

  rDHS::rDHS(ScoredRegionSet &r) {
    _process(r);
  }

  void rDHS::_process(ScoredRegionSet &r) {
    r.regions_.sort();
    for (auto &k : r.regions_.regions_) {
      rDHS_cluster(k.second, regions_.regions_[k.first]);
    }
    regions_.regions_.update_keys();
    regions_.regions_.sort();
  }

  void rDHS::write(const std::string& path) {
    size_t acc = 0;
    std::ofstream o(path);
    for (const auto& chr : regions_.regions_.sorted_keys_) {
      for (const auto &r : regions_.regions_[chr]) {
	o << chr << "\t" << r.start << "\t" << r.end << "\t"
	  << accession(acc++, 'D') << "\n";
      }
    }
  }
  
  void rDHS::write(const boost::filesystem::path& path) {
    write(path.string());
  }

  size_t rDHS::total() {
    return regions_.regions_.total();
  }

  void rDHS::expandPeaks(size_t halfwidth, ChrLengths &chromInfo) {
    regions_.regions_.expandPeaks(halfwidth, chromInfo);
  }

  void rDHS::expandPeaks(size_t halfwidth) {
    regions_.regions_.expandPeaks(halfwidth);
  }
  
} // namespace SCREEN
