namespace zlab {

typedef std::vector<double> HeatmapRow;

class Heatmap {

public:
  Heatmap(std::vector<HeatmapRow> &values);

  std::vector<HeatmapRow> values_;

  int Width() const {return values_.size();}
  int Height() const {return values_[0].size();}

  double RowDistance(int, int) const;
  double ColDistance(int, int) const;
  double SimpleDistance(int, int) const;

  std::vector<int> RowCluster(int simple = 0);
  std::vector<int> ColCluster(int simple = 0);
};

  std::ostream& operator<< (std::ostream& stream, const Heatmap&);
  
  std::vector<HeatmapRow> EmptyMatrix(int w, int h);

} // namespace zlab
