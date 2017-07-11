namespace SCREEN {

  arma::Mat<float> runCorrelation(std::vector<ScoredRegionSet>&, const std::string&);
  arma::Mat<float> runCorrelation(BinarySignal&, const std::vector<boost::filesystem::path>&,
				  const std::string&, RegionSet&);
  void writeCorrelation(arma::Mat<float>&, const boost::filesystem::path&);

} // SCREEN
