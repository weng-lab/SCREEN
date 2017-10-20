from __future__ import print_function

import sys
import os
import json

from itertools import groupby
from scipy.stats.mstats import mquantiles
import numpy as np
import math

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor


class GeneInfo:
    def __init__(self, ps, cache, assembly):
        self.ps = ps
        self.cache = cache
        self.assembly = assembly

    def info(self, name):

        return 
