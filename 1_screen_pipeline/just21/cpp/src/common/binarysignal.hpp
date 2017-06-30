namespace SCREEN {

  class BinarySignal {
    
    std::unordered_map<std::string, std::vector<Region>> values_;
    std::vector<std::string> sorted_keys_;

  public:
    BinarySignal(const boost::filesystem::path&);
    BinarySignal(RegionSet&, const boost::filesystem::path&);
    void write(const boost::filesystem::path&);

  };

} // SCREEN
