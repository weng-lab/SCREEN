namespace SCREEN {

  struct CTCF_cRE {
    uint32_t start;
    uint32_t end;
    uint32_t n_celltypes;
  };

  class CTCF_TAD {
    ChrToRegions<CTCF_cRE> cREs_;
  public:
    CTCF_TAD(const std::vector<boost::filesystem::path>&);
    void write(const boost::filesystem::path&, uint32_t binsize);
  };

} // SCREEN
