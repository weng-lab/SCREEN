#include <vector>
#include <stdexcept>
#include <functional>
#include <algorithm>
#include <iostream>

#include "heatmap.hpp"
#include "cluster_set.hpp"

std::vector<HeatmapRow> EmptyMatrix(int w, int h) {
  return std::vector<HeatmapRow>(w, HeatmapRow(h));
}

Heatmap::Heatmap(std::vector<HeatmapRow> &values) {

  Values = values;
  if (values.size() == 0) return;

  /*
   * sanity check row lengths for heatmaps with at least one row
   */
  int h = values[0].size();
  for (int n = 0; n < values.size(); ++n) {
    if (values[n].size() != h) throw std::invalid_argument("all heatmap rows must be of the same length");
  }

}

/*
 *  print a heatmap matrix
 */
void Heatmap::print_matrix() const {
  for (int i = 0; i < Width(); ++i) {
    for (int j = 0; j < Height(); ++j) {
      std::cout << Values[i][j] << "\t";
    }
    std::cout << "\n";
  }
}

/*
 *  compute the distance between two rows in a heatmap
 *  i and j are the indices of the rows to compare
 */
double Heatmap::RowDistance(int i, int j) const {

  int w = Width();
  int h = Height();

  if (i >= w){
    throw std::invalid_argument("cannot compute row distance: left index out of range");
  }
  if (j >= w){
    throw std::invalid_argument("cannot compute row distance: right index out of range");
  }

  double ret = 0;
  for (int n = 0; n < h; ++n) {
      ret += std::abs(Values[i][n] - Values[j][n]);
  }
  
  return ret;
}

/*
 *  compute the distance between two columns in a heatmap
 *  i and j are the indices of the columns to compare
 */
double Heatmap::ColDistance(int i, int j) const {
  int w = Width();
  int h = Height();

  if (i >= h){
    throw std::invalid_argument("cannot compute col distance: left index out of range");
  }
  if (j >= h){
    throw std::invalid_argument("cannot compute col distance: right index out of range");
  }

  double ret = 0.0;
  for (int n = 0; n < w; ++n) {
      ret += std::abs(Values[n][i] - Values[n][j]);
  }
  return ret;

}

std::vector<int> Heatmap::RowCluster() {

  std::vector<int> ret(Width());

  if (Width() <= 2) {
    for (int i = 0; i < Width(); ++i) ret[i] = i;
    return ret;
  }

  ClusterSet c = ClusterSet::FromRows(*this);
  std::vector<HeatmapRow> tmp(Values);

  c.docluster();
  for (int i = 0; i < Width(); ++i) {
    int w = c.indices_[0][i];
    ret[i] = w;
    for (int j = 0; j < Height(); ++j) {
      Values[i][j] = tmp[w][j];
    }
  }

  return ret;
}

std::vector<int> Heatmap::ColCluster() {

  std::vector<int> ret(Height());

  if (Height() <= 2) {
    for (int i = 0; i < Height(); ++i){
      ret[i] = i;
    }
    return ret;
  }

  ClusterSet c = ClusterSet::FromCols(*this);
  std::vector<HeatmapRow> tmp(Values);

  c.docluster();
  for (int i = 0; i < Height(); ++i) {
    int h = c.indices_[0][i];
    ret[i] = h;
    for (int j = 0; j < Width(); ++j) {
      Values[j][i] = tmp[j][h];
    }
  }

  return ret;

}

int main(int argc, char **argv) {
  std::vector<HeatmapRow> matrix = {{1.0, 1.0, 1.1, 1.0},
				    {3.1, 3.0, 3.1, 3.0},
				    {2.0, 2.0, 2.1, 2.0}};
  Heatmap hm(matrix);
  hm.print_matrix();
  std::cout << "\n";
  hm.RowCluster();
  hm.print_matrix();
  std::cout << "\n";
  hm.ColCluster();
  hm.print_matrix();
  std::cout << "\n";
}
