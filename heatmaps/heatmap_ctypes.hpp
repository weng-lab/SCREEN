extern "C" void cluster_by_rows(double *heatmap, int width, int height, int *order);
extern "C" void cluster_by_cols(double *heatmap, int width, int height, int *order);
extern "C" void cluster_by_both(double *heatmap, int width, int height, int *roworder, int *colorder);
