#pragma once

#include "gene.hpp"

namespace bib {
  
  using AccessionToGenes = std::unordered_map<std::string, std::vector<Gene>>;

} // namespace bib
