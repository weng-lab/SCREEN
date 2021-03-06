
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng



import sys
import os
import json

from itertools import groupby
from scipy.stats.mstats import mquantiles
import numpy as np
import math

class GeneInfo:
    def __init__(self, ps, cache, assembly):
        self.ps = ps
        self.cache = cache
        self.assembly = assembly

    def info(self, name):

        return
