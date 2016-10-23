typedef std::vector<double> HeatmapRow;

class Heatmap
{

public:
  std::vector<HeatmapRow> Values;

  int Width() const {return Values.size();}
  int Height() const {return Values[0].size();}

  double RowDistance(int, int) const;
  double ColDistance(int, int) const;

  std::vector<int> RowCluster();
  std::vector<int> ColCluster();
  
  Heatmap(std::vector<HeatmapRow> &values);

  void print_matrix() const;
  
};

std::vector<HeatmapRow> EmptyMatrix(int w, int h);
