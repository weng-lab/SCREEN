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
#include <iomanip>

#include <boost/filesystem.hpp>

#include "cpp/files.hpp"
#include "utils.hpp"

namespace SCREEN {

  // http://www.cplusplus.com/forum/general/15952/
  std::string accession(size_t acc, char sig, int len) {
    std::ostringstream ss, os;
    ss << std::setw(len) << std::setfill('0') << acc;
    os << "HP37" << sig << ss.str();
    return os.str();
  }
  
  std::vector<bfs::path> list_files(const bfs::path& path) {
    std::vector<bfs::path> ret;
    for (const auto& de : bib::files::dir(path)){
      if (!is_directory(de.status())) {
	ret.push_back(de.path());
      }
    }
    return ret;
  }

  std::vector<std::string> chrom_list(const std::string &path) {
    return split(run("bedextract --list-chr " + path), '\n');
  }

  std::string run(const std::string &cmd) {
    std::array<char, 128> buffer;
    std::string result;
    std::shared_ptr<FILE> pipe(popen(cmd.c_str(), "r"), pclose);
    if (!pipe) {
      throw std::runtime_error("popen() failed!");
    }
    while (!feof(pipe.get())) {
      if (fgets(buffer.data(), 128, pipe.get()) != NULL){
	result += buffer.data();
      }
    }
    return result;
  }

  void write(const std::vector<std::string> &lines, const std::string &path) {
    std::ofstream f(path);
    for (std::string line : lines) {
      f << line << "\n";
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
