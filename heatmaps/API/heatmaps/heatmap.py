from ctypes import *
from base import _c_heatmaps

"""
"   python wrapper of a heatmap
"""
class Heatmap:

    @staticmethod
    def _collapse_2d_arr(a):
        retval = []
        for r in a: retval += r
        return retval
    
    def __init__(self, values):
        self.values = values
        self.width = len(values)
        self.height = 0 if self.width == 0 else len(values[0])

    def _do_cluster(self, f, out):
        n_values = Heatmap._collapse_2d_arr(self.values)
        n_ptr = cast((c_double * len(n_values))(*n_values), POINTER(c_double))
        out_ptr = [cast((c_int * len(x))(*x), POINTER(c_int)) for x in out]
        f(n_ptr, self.width, self.height, *out_ptr)
        n_ptr = cast(n_ptr, POINTER(c_double * len(n_values)))
        out_ptr = [cast(out_ptr[n], POINTER(c_int * len(out[n]))) for n in range(0, len(out))]
        n_values = [n_ptr.contents[i] for i in range(0, len(n_values))]
        for i in range(0, self.width):
            for j in range(0, self.height):
                self.values[i][j] = n_values[i * self.height + j]
        if len(out) == 1:
            return [out_ptr[0].contents[n] for n in range(0, len(out[0]))]
        return ([out_ptr[i].contents[n] for n in range(0, len(out[i]))] for i in range(0, len(out)))
        
    def cluster_by_rows(self):
        global _c_heatmaps
        roworder = [0 for i in range(0, self.width)]
        return self._do_cluster(_c_heatmaps.cluster_by_rows, [roworder])

    def cluster_by_cols(self):
        global _c_heatmaps
        colorder = [0 for i in range(0, self.height)]
        return self._do_cluster(_c_heatmaps.cluster_by_cols, [colorder])

    def cluster_by_both(self):
        global _c_heatmaps
        roworder = [0 for i in range(0, self.width)]
        colorder = [0 for i in range(0, self.height)]
        return self._do_cluster(_c_heatmaps.cluster_by_both, [roworder, colorder])

"""
"   this region prepares CTypes to make heatmap-related calls
"""

# void cluster_by_rows(double *, int, int, int *)
_c_heatmaps.cluster_by_rows.restype = None
_c_heatmaps.cluster_by_rows.argtypes = [POINTER(c_double), c_int, c_int, POINTER(c_int)]

# void cluster_by_cols(double *, int, int, int *)
_c_heatmaps.cluster_by_cols.restype = None
_c_heatmaps.cluster_by_cols.argtypes = [POINTER(c_double), c_int, c_int, POINTER(c_int)]

# void cluster_by_both(double *, int, int, int *, int *)
_c_heatmaps.cluster_by_both.restype = None
_c_heatmaps.cluster_by_both.argtypes = [POINTER(c_double), c_int, c_int, POINTER(c_int), POINTER(c_int)]

if __name__ == "__main__":
    H = Heatmap([[1.0, 1.1, 1.0], [3.0, 3.1, 3.0], [2.0, 2.1, 2.2], [4.0, 4.1, 3.9]])
    print(H.values)
    roworder, colorder = H.cluster_by_both()
    print(H.values)
    print(roworder)
    print(colorder)
