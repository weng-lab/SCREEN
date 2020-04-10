//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#pragma once

namespace SCREEN {

  namespace bfs = boost::filesystem;

  typedef std::unordered_map<std::string, uint32_t> ChrLengths;

  ChrLengths parseChromLengths(const boost::filesystem::path&);
  std::string accession(size_t, char, int = 7);
  std::vector<bfs::path> list_files(const bfs::path&);
  template<typename Out> void split(const std::string &, char, Out);
  std::vector<std::string> split(const std::string &, char);
  void write(const std::vector<std::string> &, const std::string &);
  bool path_is_gzip(const std::string &);
  std::string basename(const std::string &);
  std::string trim_ext(const std::string &);
  std::size_t vector_hash(const std::vector<std::string> &, uint32_t);
  uint64_t lines(const std::string &);
  int exec(const std::string &);
  std::vector<std::string> chrom_list(const std::string &);
  std::string run(const std::string &);
  
} // SCREEN
