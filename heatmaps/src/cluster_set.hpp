#include "common.hpp"

class ClusterSet{
public:
  std::vector<clusterlist> indices_;
  Heatmap hm_;

private:
  distance_function df_;
  
  int best_orientation(int i, int j) const {
    int bi = indices_[i][0];
    int ei = indices_[i][indices_[i].size() - 1];
    int bj = indices_[j][0];
    int ej = indices_[j][indices_[j].size() - 1];

    std::vector<double> dists = {
      df_(hm_, ei, bj),
      df_(hm_, ei, ej),
      df_(hm_, bi, bj),
      df_(hm_, bi, ej)
    };

    return index_of_min(dists);
  }

  explicit ClusterSet(const Heatmap &h, int len,
		      distance_function df)
    : hm_(h)
    , df_(df) {
    
    indices_ = {};
    for (int n = 0; n < len; ++n) {
      indices_.push_back({n});
    }
  }

  static double coldist(const Heatmap &h, int i, int j) {
    return h.ColDistance(i, j);
  }
  
  static double rowdist(const Heatmap &h, int i, int j) {
    return h.RowDistance(i, j);
  }

public:
  int Length() const {return indices_.size();}

  void Merge(int i, int j) {
    if (i >= indices_.size()) {
      throw std::invalid_argument("cannot merge clusters: left index is out of range");}
    if (j >= indices_.size()) {
      throw std::invalid_argument("cannot merge clusters: right index is out of range");
    }

    switch(best_orientation(i, j)) {
    case 1:
      std::reverse(indices_[j].begin(), indices_[j].end());
    case 0:
      indices_[i].insert(indices_[i].end(), indices_[j].begin(), indices_[j].end());
      indices_.erase(indices_.begin() + j);
      break;
    case 2:
      std::reverse(indices_[j].begin(), indices_[j].end());
    case 3:
      indices_[j].insert(indices_[j].end(), indices_[i].begin(), indices_[i].end());
      indices_.erase(indices_.begin() + i);
      break;
    }

  }

  double ClusterDistance(int i, int j) const {
    if (i >= indices_.size()) {
      throw std::invalid_argument("cannot compute cluster distance: left index is out of range");
    }
    if (j >= indices_.size()) {
      throw std::invalid_argument("cannot compute cluster distance: right index is out of range");
    }

    double ret = df_(hm_, indices_[i][0], indices_[j][0]);

    for (int n = 0; n < indices_[i].size(); ++n) {
      for (int m = 0; m < indices_[j].size(); ++m) {
	double d = df_(hm_, indices_[i][n], indices_[j][m]);
	if (d < ret) {
	  ret = d;
	}
      }
    }
    return ret;
  }

  void docluster() {

    // main loop: continue until all clusters have been combined
    while (Length() > 1) {

      double cmin = ClusterDistance(0, 1);
      int mi = 0;
      int mj = 1;

      // find closest two clusters
      double d = 0;
      for (int i = 0; i < Length(); ++i) {
	for (int j = i + 1; j < Length(); ++j) {
	  d = ClusterDistance(i, j);
	  if (d < cmin) {
	    cmin = d;
	    mi = i;
	    mj = j;
	  }
	}
      }

      // merge the closest two clusters
      Merge(mi, mj);
    }
  }

  static ClusterSet FromRows(Heatmap &hm) {
    return ClusterSet(hm, hm.Width(), rowdist);
  }

  static ClusterSet FromCols(Heatmap &hm) {
    return ClusterSet(hm, hm.Height(), coldist);
  }

};

