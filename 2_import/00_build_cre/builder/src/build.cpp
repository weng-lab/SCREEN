#include <boost/filesystem.hpp>
#include <boost/log/trivial.hpp>
#include <boost/log/utility/setup.hpp>
#include <mutex>

#include <vector>
#include <string>
#include <fstream>
#include <iostream>
#include <algorithm>
#include <json/json.h>
#include <json/reader.h>
#include <array>
#include <zi/concurrency/concurrency.hpp>
#include <zi/system.hpp>

#include "cpp/utility.hpp"
#include "cpp/gzip_reader.hpp"
#include "cpp/tictoc.hpp"
#include "cpp/gzstream.hpp"

#include <zi/zargs/zargs.hpp>
ZiARG_string(file, "", "file to load");
ZiARG_bool(first, false, "show first line");
ZiARG_int32(j, zi::system::cpu_count, "num threads");

namespace bib {

struct MousePaths {


};

template <typename T>
class Builder {
    T paths_;

public:
    Builder(MousePaths paths)
        : paths_(paths)
    {}

    void build(){

    }
};

} // namespace bib

int main(int argc, char* argv[]){
    zi::parse_arguments(argc, argv, true);  // modifies argc and argv
    const auto args = std::vector<std::string>(argv + 1, argv + argc);

    try {
        bib::MousePaths paths;
        bib::Builder<bib::MousePaths> b(paths);
        b.build();
    } catch(const std::exception& ex){
        std::cerr << ex.what() << std::endl;
        return 1;
    }

    return 0;
}
