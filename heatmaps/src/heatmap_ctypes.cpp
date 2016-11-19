#include <vector>
#include <iostream>

#include "heatmap.hpp"
#include "heatmap_ctypes.hpp"

using namespace zlab;

std::vector<HeatmapRow> matrix_from_ptr(double *matrix,
					int width, int height) {
  std::vector<HeatmapRow> retval = EmptyMatrix(width, height);
  for (int i = 0; i < width; ++i) {
    std::copy(matrix + i * height, matrix + (i + 1) * height, retval[i].begin());
  }
  return retval;
}

void copy_vector_to_ptr(std::vector<HeatmapRow> &matrix,
			double *dst_matrix) {
  for (int i = 0; i < matrix.size(); ++i) {
    std::copy(matrix[i].begin(), matrix[i].end(),
	      dst_matrix + i * matrix[i].size());
  }
}

std::vector<int> list_from_ptr(int *matrix, int len) {
  return std::vector<int>(matrix, matrix + len);
}

void copy_list_to_ptr(std::vector<int> &list, int *dst_list) {
  std::copy(list.begin(), list.end(), dst_list);
}

extern "C" void cluster_by_rows(double *heatmap, int width, int height, int *order) {
  std::vector<HeatmapRow> matrix = matrix_from_ptr(heatmap, width, height);
  Heatmap hm(matrix);
  std::vector<int> roworder = hm.RowCluster();
  copy_vector_to_ptr(hm.values_, heatmap);
  copy_list_to_ptr(roworder, order);
}

extern "C" void cluster_by_cols(double *heatmap, int width, int height, int *order) {
  std::vector<HeatmapRow> matrix = matrix_from_ptr(heatmap, width, height);
  Heatmap hm(matrix);
  std::vector<int> colorder = hm.ColCluster();
  copy_vector_to_ptr(hm.values_, heatmap);
  copy_list_to_ptr(colorder, order);
}

extern "C" void cluster_by_both(double *heatmap, int width, int height, int *roworder, int *colorder) {
  std::vector<HeatmapRow> matrix = matrix_from_ptr(heatmap, width, height);
  Heatmap hm(matrix);
  std::vector<int> mcolorder = hm.ColCluster();
  std::vector<int> mroworder = hm.RowCluster();
  copy_vector_to_ptr(hm.values_, heatmap);
  copy_list_to_ptr(mroworder, roworder);
  copy_list_to_ptr(mcolorder, colorder);
}
