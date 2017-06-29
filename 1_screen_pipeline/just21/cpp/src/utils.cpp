#include <vector>
#include <string>
#include <functional>
#include <algorithm>
#include <fstream>
#include <sstream>
#include <iterator>
#include <cstdio>
#include <iostream>
#include <memory>
#include <array>

#include <boost/filesystem.hpp>
#include <boost/filesystem/path.hpp>

#include "utils.hpp"

namespace SCREEN {

  std::vector<bfs::path> list_files(const bfs::path &dir) {
    bfs::directory_iterator end_itr;
    std::vector<bfs::path> retval;
    for(bfs::directory_iterator itr(dir); itr != end_itr; ++itr) {
      if (!is_directory(itr->status())) {
	retval.push_back(itr->path());
      }
    }
    return retval;
  }

  std::vector<std::string> chrom_list(const std::string &path) {
    return split(run("bedextract --list-chr " + path), '\n');
  }

  std::string run(const std::string &cmd) {
    std::array<char, 128> buffer;
    std::string result;
    std::shared_ptr<FILE> pipe(popen(cmd.c_str(), "r"), pclose);
    if (!pipe) throw std::runtime_error("popen() failed!");
    while (!feof(pipe.get())) {
      if (fgets(buffer.data(), 128, pipe.get()) != NULL)
	result += buffer.data();
    }
    return result;
  }

  void write(const std::vector<std::string> &lines, const std::string &path) {
    std::ofstream f(path);
    for (std::string line : lines) {
      f << line << "\n";
    }
  }

  void read(std::vector<std::string> &lines, const std::string &path) {
    std::ifstream i(path);
    std::string line;
    while (std::getline(i, line)) {
      lines.push_back(line);
    }
  }
  
  bool path_is_gzip(const std::string &path) {
    return path.size() >= 3 && 0 == path.compare(path.size() - 3, 3, ".gz");
  };

  std::string basename(const std::string &path) {
    std::vector<std::string> p = split(path, '/');
    return p[p.size() - 1];
  }

  std::string trim_ext(const std::string &filename) {
    std::vector<std::string> p = split(filename, '.');
    return p[0];
  }

  uint64_t lines(const std::string &path) {
    std::ifstream in(path);
    std::string line;
    uint64_t retval = 0;
    while (std::getline(in, line, '\n')) ++retval;
    return retval;
  }

  int exec(const std::string &cmd) {
    return std::system(cmd.c_str());
  }

  template<typename Out>
  void split(const std::string &s, char delim, Out result) {
    std::stringstream ss;
    ss.str(s);
    std::string item;
    while (std::getline(ss, item, delim)) {
      *(result++) = item;
    }
  }

  std::vector<std::string> split(const std::string &s, char delim) {
    std::vector<std::string> elems;
    split(s, delim, std::back_inserter(elems));
    return elems;
  }

} // SCREEN
