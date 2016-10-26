typedef std::vector<double> HeatmapRow;

class Heatmap {

public:
  Heatmap(std::vector<HeatmapRow> &values);

  std::vector<HeatmapRow> values_;

  int Width() const {return values_.size();}
  int Height() const {return values_[0].size();}

  double RowDistance(int, int) const;
  double ColDistance(int, int) const;

  std::vector<int> RowCluster();
  std::vector<int> ColCluster();

  void print_matrix() const;
};

std::vector<HeatmapRow> EmptyMatrix(int w, int h);
