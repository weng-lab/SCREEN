typedef std::function<double(const Heatmap &, int, int)> distance_function;
typedef std::vector<int> clusterlist;

int index_of_min(const std::vector<double>& d) {
  return std::distance(d.begin(),
		       std::min_element(d.begin(), d.end()));
}
