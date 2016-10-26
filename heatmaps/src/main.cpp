#include <vector>
#include <iostream>

#include "heatmap.hpp"

int main(int argc, char **argv) {
  std::vector<zlab::HeatmapRow> matrix = {{1.0, 1.0, 1.1, 1.0},
					  {3.1, 3.0, 3.1, 3.0},
					  {2.0, 2.0, 2.1, 2.0}};
  zlab::Heatmap hm(matrix);
  std::cout << hm << "\n";
  
  hm.RowCluster();
  std::cout << hm << "\n";
  
  hm.ColCluster();
  std::cout << hm << "\n";
}
