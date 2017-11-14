namespace SCREEN {

  struct cRE {
    uint32_t start;
    uint32_t end;
    char accession[12];
    float DNaseZ;
    float H3K4me3Z;
    float H3K27acZ;
    float CTCFZ;
    bool proximal;
  };

  typedef std::function<bool (const cRE&)> cREFilter;

  class cRESet {
  public:
    std::vector<cRE> cREs_;
    cRESet(const std::vector<cRE> &cREs) : cREs_(cREs) {}
    cRESet(const cRESet&, cREFilter);

    cRESet promoterLike();
    cRESet enhancerLike();
    cRESet CTCF_only();
    cRESet DNase_only();
    cRESet inactive();
    cRESet high_H3K4me3();
    cRESet high_H3K27ac();
    cRESet high_CTCF();
    cRESet high_DNase();

  };

};
