#include <vector>
#include <stdexcept>
#include <functional>
#include <algorithm>
#include <iostream>

#include "heatmap.hpp"
#include "cluster_set.hpp"

namespace zlab {
  
std::vector<HeatmapRow> EmptyMatrix(int w, int h) {
  return std::vector<HeatmapRow>(w, HeatmapRow(h));
}

Heatmap::Heatmap(std::vector<HeatmapRow> &values) {
  values_ = values;
  
  if (0 == values.size()){
    return;
  }

  //sanity check row lengths for heatmaps with at least one row

  int h = values[0].size();
  for (int n = 0; n < values.size(); ++n) {
    if (values[n].size() != h) {
      throw std::invalid_argument("all heatmap rows must be of the same length");
    }
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
      ret += std::abs(values_[i][n] - values_[j][n]);
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
      ret += std::abs(values_[n][i] - values_[n][j]);
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
  std::vector<HeatmapRow> tmp(values_);

  c.docluster();
  for (int i = 0; i < Width(); ++i) {
    int w = c.indices_[0][i];
    ret[i] = w;
    for (int j = 0; j < Height(); ++j) {
      values_[i][j] = tmp[w][j];
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
  std::vector<HeatmapRow> tmp(values_);

  c.docluster();
  for (int i = 0; i < Height(); ++i) {
    int h = c.indices_[0][i];
    ret[i] = h;
    for (int j = 0; j < Width(); ++j) {
      values_[j][i] = tmp[j][h];
    }
  }

  return ret;

}
  
  std::ostream& operator<<(std::ostream& s, const Heatmap& hm) {
    for (int i = 0; i < hm.Width(); ++i) {
      for (int j = 0; j < hm.Height(); ++j) {
	std::cout << hm.values_[i][j] << "\t";
      }
      std::cout << "\n";
    }
    return s;
  }

  
} // namespace zlab
