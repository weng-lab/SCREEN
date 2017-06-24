#pragma once

namespace SCREEN {

  using matrix_entry = std::unordered_map<std::string, std::string>;
  
  class LookupMatrix {
    std::unordered_map<std::string, matrix_entry> matrix_;
    
  public:
    std::vector<matrix_entry> AllDNase_, AllH3K4me3_, AllH3K27ac_, AllCTCF_, AllFour_;

    LookupMatrix(const std::string&);
    bool biosample_has(const std::string&, const std::string&);
    bool biosample_has_all(const std::string&);
    matrix_entry& operator [](const std::string&);
  };
  
} // SCREEN
