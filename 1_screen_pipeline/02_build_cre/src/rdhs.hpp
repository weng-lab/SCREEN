//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#pragma once

#include "gene.hpp"

namespace bib {
  
  using AccessionToGenes = std::unordered_map<std::string, std::vector<Gene>>;

} // namespace bib
