#pragma once

namespace bib {
  
  struct SignalLine {
    int32_t rank;
    float signal;
    float zscore;

    float avg_zscore;
    float left_zscore;
    float right_zscore;
  };

  class SignalFile {
    bfs::path fnp_;
    std::string fn_;

    std::string conservation_;

    std::unordered_map<std::string, SignalLine> lines_;

  public:
    SignalFile()
    {}

    SignalFile(const bfs::path fnp)
      : fnp_(fnp)
    {
      fn_ = fnp.filename().string();
    }

    void reserve(size_t s){
      lines_.reserve(s);
    }

    const std::string& Conservation() const {
      return conservation_;
    }

    void setSignalLine(const auto& toks){
      SignalLine s;
      if(4 == toks.size()){
	// MP-2175312-100.000000  -0.08  0.95  635383
	// mpName                 zscore signal rank
	s.zscore = std::stof(toks[1]);
	s.signal = std::stof(toks[2]);
	s.rank = std::stoi(toks[3]);
      } else if(3 == toks.size()){
	// MP-1034943-3.371610     0.0183822       611359
	s.signal = std::stof(toks[1]);
	s.rank = std::stoi(toks[2]);
      } else if(5 == toks.size()){
	// MP-2175312-100.000000  -0.70  1060099  -0.08  -1.33
	// mpName                 avgZ   rank     leftZ  rightZ
	s.avg_zscore = std::stof(toks[1]);
	s.rank = std::stoi(toks[2]);
	s.left_zscore = std::stof(toks[3]);
	s.right_zscore = std::stof(toks[4]);
      } else {
	throw std::runtime_error("invalid num toks");
      }
      lines_[toks[0]] = std::move(s);
    }

    bool hasMpName(const std::string& mpName) const {
      return bib::in(mpName, lines_);
    }

    bool isConservation() const {
      return bib::str::startswith(fn_, "mm10.60way.");
    }

  };

} // namespace bib
