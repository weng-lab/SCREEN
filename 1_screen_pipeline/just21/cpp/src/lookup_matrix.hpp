namespace SCREEN {

  typedef std::unordered_map<std::string, std::string> matrix_entry;
  
  class LookupMatrix {
    
  public:
    std::unordered_map<std::string, matrix_entry> matrix_;
    LookupMatrix(const std::string &);
    bool biosample_has(const std::string &, const std::string &);
    bool biosample_has_all(const std::string &);
    matrix_entry &operator [](const std::string &);
    std::vector<matrix_entry> AllDNase_, AllH3K4me3_, AllH3K27ac_, AllCTCF_, AllFour_;
    
  };
  
} // SCREEN
