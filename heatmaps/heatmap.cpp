#include <vector>
#include <stdexcept>
#include <functional>
#include <algorithm>
#include <iostream>

#include "heatmap.hpp"

int index_of_min(std::vector<double> d) {
  if (d.size() == 0) return -1;
  int retval = 0;
  double cmin = d[0];
  for (int n = 0; n < d.size(); ++n) {
    if (d[n] < cmin) {
      cmin = d[n];
      retval = n;
    }
  }
  return retval;
}

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
  double retval = 0.0;

  if (i >= w) throw std::invalid_argument("cannot compute row distance: left index out of range");
  if (j >= w) throw std::invalid_argument("cannot compute row distance: right index out of range");

  for (int n = 0; n < h; ++n) {
      retval += std::abs(Values[i][n] - Values[j][n]);
  }
  return retval;

}

/*
 *  compute the distance between two columns in a heatmap
 *  i and j are the indices of the columns to compare
 */
double Heatmap::ColDistance(int i, int j) const {

  int w = Width();
  int h = Height();
  double retval = 0.0;

  if (i >= h) throw std::invalid_argument("cannot compute col distance: left index out of range");
  if (j >= h) throw std::invalid_argument("cannot compute col distance: right index out of range");

  for (int n = 0; n < w; ++n) {
      retval += std::abs(Values[n][i] - Values[n][j]);
  }
  return retval;

}

typedef std::function<double(const Heatmap &, int, int)> distance_function;
typedef std::vector<int> clusterlist;
class ClusterSet
{

private:

  distance_function df;
  int best_orientation(int i, int j) const {

    int _bi = Indices[i][0];
    int _ei = Indices[i][Indices[i].size() - 1];
    int _bj = Indices[j][0];
    int _ej = Indices[j][Indices[j].size() - 1];

    std::vector<double> dists = {
      df(H, _ei, _bj),
      df(H, _ei, _ej),
      df(H, _bi, _bj),
      df(H, _bi, _ej)
    };

    return index_of_min(dists);

  }

  explicit ClusterSet(const Heatmap &_H, int l, distance_function _df) : H(_H) {
    df = _df;
    Indices = {};
    for (int n = 0; n < l; ++n) {
      Indices.push_back({n});
    }
  }

  static double coldist(const Heatmap &H, int i, int j) {return H.ColDistance(i, j);};
  static double rowdist(const Heatmap &H, int i, int j) {return H.RowDistance(i, j);};

public:
  std::vector<clusterlist> Indices;
  Heatmap H;

  int Length() const {return Indices.size();}

  void Merge(int i, int j) {

    if (i >= Indices.size()) throw std::invalid_argument("cannot merge clusters: left index is out of range");
    if (j >= Indices.size()) throw std::invalid_argument("cannot merge clusters: right index is out of range");

    switch(best_orientation(i, j)) {
    case 1:
      std::reverse(Indices[j].begin(), Indices[j].end());
    case 0:
      Indices[i].insert(Indices[i].end(), Indices[j].begin(), Indices[j].end());
      Indices.erase(Indices.begin() + j);
      break;
    case 2:
      std::reverse(Indices[j].begin(), Indices[j].end());
    case 3:
      Indices[j].insert(Indices[j].end(), Indices[i].begin(), Indices[i].end());
      Indices.erase(Indices.begin() + i);
      break;
    }

  }

  double ClusterDistance(int i, int j) const {

    if (i >= Indices.size()) throw std::invalid_argument("cannot compute cluster distance: left index is out of range");
    if (j >= Indices.size()) throw std::invalid_argument("cannot compute cluster distance: right index is out of range");

    double retval = df(H, Indices[i][0], Indices[j][0]);
    double d;
    for (int n = 0; n < Indices[i].size(); ++n) {
      for (int m = 0; m < Indices[j].size(); ++m) {
	d = df(H, Indices[i][n], Indices[j][m]);
	if (d < retval) retval = d;
      }
    }
    return retval;

  }

  void docluster() {

    /*
     *  main loop: continue until all clusters have been combined
     */
    while (Length() > 1) {

      double cmin = ClusterDistance(0, 1);
      double d;
      int _mi = 0;
      int _mj = 1;

      /*
       *  find closest two clusters
       */
      for (int i = 0; i < Length(); ++i) {
	for (int j = i + 1; j < Length(); ++j) {
	  d = ClusterDistance(i, j);
	  if (d < cmin) {
	    cmin = d;
	    _mi = i;
	    _mj = j;
	  }
	}
      }

      /*
       *  merge the closest two clusters
       */
      Merge(_mi, _mj);

    }

  }

  static ClusterSet FromRows(Heatmap &H) {
    distance_function _rowdist = rowdist;
    return ClusterSet(H, H.Width(), _rowdist);
  }

  static ClusterSet FromCols(Heatmap &H) {
    distance_function _coldist = coldist;
    return ClusterSet(H, H.Height(), _coldist);
  }

};

std::vector<int> Heatmap::RowCluster() {

  std::vector<int> retval(Width());

  if (Width() <= 2) {
    for (int i = 0; i < Width(); ++i) retval[i] = i;
    return retval;
  }

  ClusterSet c = ClusterSet::FromRows(*this);
  std::vector<HeatmapRow> tmp = std::vector<HeatmapRow>(Values);

  c.docluster();
  for (int i = 0; i < Width(); ++i) {
    int w = c.Indices[0][i];
    retval[i] = w;
    for (int j = 0; j < Height(); ++j) {
      Values[i][j] = tmp[w][j];
    }
  }

  return retval;

}

std::vector<int> Heatmap::ColCluster() {

  std::vector<int> retval(Height());

  if (Height() <= 2) {
    for (int i = 0; i < Height(); ++i) retval[i] = i;
    return retval;
  }

  ClusterSet c = ClusterSet::FromCols(*this);
  std::vector<HeatmapRow> tmp = std::vector<HeatmapRow>(Values);

  c.docluster();
  for (int i = 0; i < Height(); ++i) {
    int h = c.Indices[0][i];
    retval[i] = h;
    for (int j = 0; j < Width(); ++j) {
      Values[j][i] = tmp[j][h];
    }
  }

  return retval;

}

int main(int argc, char **argv) {
  std::vector<HeatmapRow> matrix = {{1.0, 1.0, 1.1, 1.0}, {3.1, 3.0, 3.1, 3.0}, {2.0, 2.0, 2.1, 2.0}};
  Heatmap h = Heatmap(matrix);
  h.print_matrix();
  std::cout << "\n";
  h.RowCluster();
  h.print_matrix();
  std::cout << "\n";
  h.ColCluster();
  h.print_matrix();
  std::cout << "\n";
}
