typedef std::function<double(const Heatmap &, int, int)> distance_function;
typedef std::vector<int> clusterlist;

int index_of_min(std::vector<double> d) {
  if (0 == d.size()){
    return -1;
  }
  
  int ret = 0;
  double cmin = d[0];
  for (int n = 0; n < d.size(); ++n) {
    if (d[n] < cmin) {
      cmin = d[n];
      ret = n;
    }
  }
  return ret;
}

