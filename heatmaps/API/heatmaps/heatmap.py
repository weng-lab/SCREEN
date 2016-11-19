from ctypes import *
from base import _c_heatmaps

class Tree:
    def __init__(self, Label = -1, Left = None, Right = None):
        self.Left = Left
        self.Right = Right
        self.Label = Label
        
    def _print(self, prefix = "", labels = []):
        if self.Label < 0 or self.Label >= len(labels):
            print(prefix + str(self.Label))
        else:
            print(prefix + str(labels[self.Label]))
        if self.Left is not None: self.Left._print(prefix + "  ", labels)
        if self.Right is not None: self.Right._print(prefix + "  ", labels)

    def depth(self):
        if self.Left is not None:
            if self.Right is not None:
                return 1 + max(self.Left.depth(), self.Right.depth())
            return 1 + self.Left.depth()
        elif self.Right is not None:
            return 1 + self.Right.depth()
        return 1

    def to_json(self, labels = [], root_depth = 0):
        if self.Left is not None and self.Right is not None:
            return {"name": "",
                    "children": [self.Right.to_json(labels, root_depth - 1),
                                 self.Left.to_json(labels, root_depth - 1) ]}
        if root_depth > 0:
            return {"name": "",
                    "children": [self.to_json(labels, root_depth - 1)] }
        name = str(self.Label)
        if self.Label >= 0 and self.Label < len(labels):
            name = labels[self.Label]
        return {"name": name}
        
    @staticmethod
    def from_list(lst):
        l = (len(lst) + 1) * 2
        nodes = []
        for x in range(0, l - 1):
            nodes.append(Tree(x))
        for x in range(len(lst) - 1, -1, -1):
            p = lst[x]
            nodes[x + len(lst) + 1].Left = nodes[p / l]
            nodes[x + len(lst) + 1].Right = nodes[p % l]
        return nodes[-1]

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
        roworder = [0 for i in range(0, self.width * 2 - 1)]
        output = self._do_cluster(_c_heatmaps.cluster_by_rows, [roworder])
        return (output[:self.width], output[self.width:])

    def cluster_by_cols(self):
        global _c_heatmaps
        colorder = [0 for i in range(0, self.height * 2 - 1)]
        output = self._do_cluster(_c_heatmaps.cluster_by_cols, [colorder])
        return (output[:self.height], output[self.height:])

    def cluster_by_both(self):
        global _c_heatmaps
        roworder = [0 for i in range(0, self.width * 2 - 1)]
        colorder = [0 for i in range(0, self.height * 2 - 1)]
        rowoutput, coloutput = self._do_cluster(_c_heatmaps.cluster_by_both, [roworder, colorder])
        return ((rowoutput[:self.width], rowoutput[self.width:]),
                (coloutput[:self.height], coloutput[self.height:]))

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
