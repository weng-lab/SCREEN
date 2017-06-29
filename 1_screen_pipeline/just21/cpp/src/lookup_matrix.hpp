#pragma once

namespace SCREEN {

  using matrix_entry = std::unordered_map<std::string, std::string>;
  namespace bfs = boost::filesystem;
  
  class LookupMatrix {
    std::unordered_map<std::string, matrix_entry> matrix_;
    
  public:
    std::vector<matrix_entry> AllDNase_;
    std::vector<matrix_entry> AllH3K4me3_;
    std::vector<matrix_entry> AllH3K27ac_;
    std::vector<matrix_entry> AllCTCF_;
    std::vector<matrix_entry> AllFour_;

    LookupMatrix(const std::string&);
    bool biosample_has(const std::string&, const std::string&);
    bool biosample_has_all(const std::string&);
    matrix_entry& operator [](const std::string&);
  };
  
} // SCREEN
