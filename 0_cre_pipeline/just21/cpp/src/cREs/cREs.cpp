#include <vector>
#include <functional>
#include <algorithm>

#include "cREs.hpp"

namespace SCREEN {
  
  cRESet::cRESet(const cRESet &original, cREFilter filter) {
    std::copy_if(original.cREs_.begin(), original.cREs_.end(), cREs_.begin(), filter);
  }

  cRESet cRESet::promoterLike() {
    return cRESet(cREs_, [](const cRE &c) { return c.proximal && c.DNaseZ > 1.64 && c.H3K4me3Z > 1.64; });
  }

  cRESet cRESet::enhancerLike() {
    return cRESet(cREs_, [](const cRE &c) { return !c.proximal && c.DNaseZ > 1.64 && c.H3K27acZ > 1.64; });
  }

  cRESet cRESet::CTCF_only() {
    return cRESet(cREs_, [](const cRE &c) { return c.DNaseZ > 1.64 && c.CTCFZ > 1.64 && c.H3K27acZ <= 1.64 && c.H3K4me3Z <= 1.64; });
  }

  cRESet cRESet::DNase_only() {
    return cRESet(cREs_, [](const cRE &c) { return c.DNaseZ > 1.64 && c.CTCFZ <= 1.64 && c.H3K27acZ <= 1.64 && c.H3K4me3Z <= 1.64; });
  }

  cRESet cRESet::inactive() {
    return cRESet(cREs_, [](const cRE &c) { return c.DNaseZ <= 1.64; });
  }

  cRESet cRESet::high_DNase() {
    return cRESet(cREs_, [](const cRE &c) { return c.DNaseZ > 1.64; });
  }

  cRESet cRESet::high_H3K4me3() {
    return cRESet(cREs_, [](const cRE &c) { return c.H3K4me3Z > 1.64; });
  }

  cRESet cRESet::high_H3K27ac() {
    return cRESet(cREs_, [](const cRE &c) { return c.H3K27acZ > 1.64; });
  }

  cRESet cRESet::high_CTCF() {
    return cRESet(cREs_, [](const cRE &c) { return c.CTCFZ > 1.64; });
  }
  
};
