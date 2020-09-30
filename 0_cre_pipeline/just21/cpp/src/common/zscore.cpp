//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#include <vector>
#include <fstream>
#include <iterator>
#include <string>
#include <cmath>
#include <numeric>
#include <unordered_map>

#include <boost/filesystem.hpp>

#include "zentLib/src/BigWigWrapper.hpp"
#include "cpp/files.hpp"
#include "cpp/string_utils.hpp"

#include "utils.hpp"
#include "lambda.hpp"
#include "region.hpp"
#include "zscore.hpp"

namespace SCREEN {

  float log10orNeg10(float x) {
    // TODO: floating point tolerance?
    // http://realtimecollisiondetection.net/blog/?p=89
    if (0.0 == x){
      return -10.0;
    }
    return std::log10(x + 0.01);
  }
  
} // SCREEN
