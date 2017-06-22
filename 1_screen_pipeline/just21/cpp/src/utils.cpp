#include <vector>
#include <string>
#include <functional>
#include <algorithm>
#include <fstream>
#include <sstream>
#include <iterator>

#include "utils.hpp"

namespace SCREEN {

  void write(const std::vector<std::string> &lines, const std::string &path) {
    std::ofstream o(path);
    for (std::string line : lines) o << line << "\n";
  }

  void read(std::vector<std::string> &lines, const std::string &path) {
    std::ifstream i(path);
    std::string line;
    while (std::getline(i, line)) lines.push_back(line);
  }
  
  bool path_is_gzip(const std::string &path) {
    return path.length() >= 3 && path.compare(path.length() - 3, 3, ".gz") == 0;
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
