//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

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
    ret += std::pow(std::abs(values_[i][n] - values_[j][n]), 2.0);
  }
  
  return std::sqrt(ret);
}

  /*
   *  gets the inverse of the value of a cell
   *  will be lowest for the closest two elements in the heatmap
   */
  double Heatmap::SimpleDistance(int i, int j) const {
    int w = Width();
    int h = Height();

    if (w != h) {
      throw std::logic_error("cannot compute simple distance: heatmap must be square");
    }
    if (i >= w) {
      throw std::invalid_argument("cannot compute distance: left index out of range");
    }
    if (j >= w) {
      throw std::invalid_argument("cannot compute distance: right index out of range");
    }
    
    return 1.0 / values_[i][j];
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
    ret += std::pow(std::abs(values_[n][i] - values_[n][j]), 2.0);
  }
  return std::sqrt(ret);

}

  std::vector<int> Heatmap::RowCluster(int use_simple_distance) {

    ClusterSet c = ClusterSet::FromRows(*this);
    std::vector<int> ret;

    // for two or less elements, the result is constant
    if (Width() <= 2) {
      for (int i = 0; i < Width(); ++i) {
	ret.push_back(i);
      }
      if (Width() == 2) {
	ret.push_back(1);
      }
    }

    // perform the clustering and rearrange the matrix accordingly
    std::vector<HeatmapRow> tmp(values_);
    c.docluster();
    for (int i = 0; i < Width(); ++i) {
      int w = c.indices_[0][i];
      for (int j = 0; j < Height(); ++j) {
	values_[i][j] = tmp[w][j];
      }
    }

    // the return vector contains the roworder first and tree second
    std::copy(c.indices_[0].begin(), c.indices_[0].end(), std::back_inserter(ret));
    std::copy(c.tree_.begin() + c.indices_[0].size(), c.tree_.end(), std::back_inserter(ret));
    return ret;
    
  }

  std::vector<int> Heatmap::ColCluster(int use_simple_distance) {

    ClusterSet c = ClusterSet::FromCols(*this);
    std::vector<int> ret;

    // for two or less elements, the result is constant
    if (Height() <= 2) {
      for (int i = 0; i < Height(); ++i) {
	ret.push_back(i);
      }
      if (Height() == 2) {
	ret.push_back(1);
      }
    }

    // perform the clustering and rearrange the matrix accordingly
    std::vector<HeatmapRow> tmp(values_);
    c.docluster();
    for (int i = 0; i < Height(); ++i) {
      int h = c.indices_[0][i];
      for (int j = 0; j < Width(); ++j) {
	values_[j][i] = tmp[j][h];
      }
    }

    // the return vector contains the roworder first and tree second
    std::copy(c.indices_[0].begin(), c.indices_[0].end(), std::back_inserter(ret));
    std::copy(c.tree_.begin() + c.indices_[0].size(), c.tree_.end(), std::back_inserter(ret));
    return ret;
    
  }
  
  std::ostream& operator<<(std::ostream& s, const Heatmap& hm) {
    for (int i = 0; i < hm.Width(); ++i) {
      for (int j = 0; j < hm.Height(); ++j) {
	s << hm.values_[i][j] << "\t";
      }
      s << "\n";
    }
    return s;
  }

  
} // namespace zlab
