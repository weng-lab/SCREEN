from ctypes import *
import os

_root_dir = os.path.join(os.path.dirname(__file__), "../..")

"""
"   loads a library from ../../lib; returns the result as a CTypes library object
"""
def LoadCLibrary(fn):
    cwd = os.getcwd()
    os.chdir(_root_dir)
    fnp = os.path.join("lib", fn)
    if not os.path.exists(fnp):
        raise Exception("library not found at path %s" % fnp)
    retval = cdll.LoadLibrary(fnp)
    os.chdir(cwd)
    return retval


"""
"   container class for the heatmaps library
"""
class heatmaps:
    def __init__(self):
        self._std_c = cdll.LoadLibrary("libc.so.6")
        self._std_cpp = cdll.LoadLibrary("libstdc++.so.6")
        self._c_heatmaps = LoadCLibrary("libheatmap.so")
#        self._c_heatmaps_ctypes = LoadCLibrary("libheatmapctypes.so")
        
_heatmaps = heatmaps()
_c_heatmaps = _heatmaps._c_heatmaps
