#include "common.hpp"

namespace zlab {

  class ClusterSet{
  public:
    std::vector<clusterlist> indices_;
    std::vector<int> tree_;

  private:
    int node_ptr_;
    std::vector<int> nodei_;
    std::vector<std::vector<double>> distance_matrix_;

    int best_orientation(int i, int j) const {
      int bi = indices_[i][0];
      int ei = indices_[i][indices_[i].size() - 1];
      int bj = indices_[j][0];
      int ej = indices_[j][indices_[j].size() - 1];

      std::vector<double> dists {distance_matrix_[ei][bj],
	  distance_matrix_[ei][ej],
	  distance_matrix_[bi][bj],
	  distance_matrix_[bi][ej]
	  };

      return index_of_min(dists);
    }

    explicit ClusterSet(const Heatmap &h, int orient_by_cols = 0) {

      distance_function df = (orient_by_cols ? ClusterSet::coldist : ClusterSet::rowdist);
      int l = (orient_by_cols ? h.Height() : h.Width());
      indices_ = {};
      nodei_ = {};
      node_ptr_ = l;
      tree_ = std::vector<int>(l * 2 - 1);

      // initlialize clusters
      for (int n = 0; n < l; ++n) {
	indices_.push_back({n});
	nodei_.push_back(n);
      }

      // compute distance matrix
      std::vector<std::vector<double>> distance_matrix(l, std::vector<double>(l));
      for (int i = 0; i < l; ++i) {
	distance_matrix[i][i] = 0.0;
	for (int j = i + 1; j < l; ++j) {
	  distance_matrix[i][j] = distance_matrix[j][i] = df(h, i, j);
	}
      }
      distance_matrix_ = distance_matrix;

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

      // make sure indices are valid
      if (i >= indices_.size()) {
	throw std::invalid_argument("cannot merge clusters: left index is out of range");}
      if (j >= indices_.size()) {
	throw std::invalid_argument("cannot merge clusters: right index is out of range");
      }

      // make note of which clusters were merged for the tree
      tree_[node_ptr_] = nodei_[i] * distance_matrix_.size() * 2 + nodei_[j];
      nodei_[i] = nodei_[j] = node_ptr_++;

      // find best orientation for the clusters and merge
      switch(best_orientation(i, j)) {
      case 1:
	std::reverse(indices_[j].begin(), indices_[j].end());
      case 0:
	indices_[i].insert(indices_[i].end(), indices_[j].begin(), indices_[j].end());
	indices_.erase(indices_.begin() + j);
	nodei_.erase(nodei_.begin() + j);
	break;
      case 2:
	std::reverse(indices_[j].begin(), indices_[j].end());
      case 3:
	indices_[j].insert(indices_[j].end(), indices_[i].begin(), indices_[i].end());
	indices_.erase(indices_.begin() + i);
	nodei_.erase(nodei_.begin() + i);
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

      double ret = 0.0;

      for (int n = 0; n < indices_[i].size(); ++n) {
	for (int m = 0; m < indices_[j].size(); ++m) {
	  ret += distance_matrix_[indices_[i][n]][indices_[j][m]];
	}
      }
      return ret / (double)(indices_[i].size() + indices_[j].size());
    }

    void docluster() {

      // main loop: continue until all clusters have been combined
      while (Length() > 1) {
	double cmin = ClusterDistance(0, 1);
	int mi = 0;
	int mj = 1;

	// find closest two clusters
	double d = 0;
	for (auto i = 0; i < Length(); ++i) {
	  for (auto j = i + 1; j < Length(); ++j) {
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
      return ClusterSet(hm, 0);
    }

    static ClusterSet FromCols(Heatmap &hm) {
      return ClusterSet(hm, 1);
    }

  };

} // namespace zlab
