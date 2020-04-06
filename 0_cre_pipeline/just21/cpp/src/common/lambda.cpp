//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#include <cmath>
#include <functional>
#include <unordered_map>
#include <iostream>

#include "cpp/files.hpp"
#include "cpp/string_utils.hpp"

#include "lambda.hpp"
#include "utils.hpp"

namespace SCREEN {
  
  RegionFilter QFilter(float threshold) {
    float nlog = -std::log(threshold);
    return [nlog](std::vector<std::string> &line) {
      return line.size() >= 9 && std::stof(line[8]) > nlog;
    };
  }

} // SCREEN
