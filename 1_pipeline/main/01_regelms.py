#!/usr/bin/env python

from __future__ import print_function

import os, sys
import json
import gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
sys.path.append("../common")
from files_and_paths import Dirs
from utils import Utils

from matplotlib import use
use('Agg') # shut off any matplotlib visual display attempts
from matplotlib import pyplot, cm
import numpy

ranks = {"dnase": {},
         "promoter": {},
         "ctcf": {},
         "enhancer": {},
         "confidence": []}

keys = ["dnase", "promoter", "ctcf", "enhancer"]

def hexplot(dx, dy, outfnp):
    n = 10000
    x = numpy.linspace(0, max(dx), 100)
    y = numpy.linspace(0, max(dy), 100)
    X, Y = numpy.meshgrid(x, y)
    x = X.ravel()
    y = Y.ravel()
    gridsize = 30
    pyplot.subplot(111)
    
    pyplot.hexbin(dx, dy, gridsize=gridsize, cmap=cm.jet, bins='log')
    pyplot.axis([x.min(), x.max(), y.min(), y.max()])
    
    cb = pyplot.colorbar()
    cb.set_label('log occurrences')
    pyplot.savefig(outfnp)
    pyplot.clf()

    
def main():
    fnp = os.path.join(Dirs.encyclopedia, "Version-4", "regulatory-element-registry-hg19.V2.json.gz")
    onp = os.path.join(Dirs.encyclopedia, "Version-4", "hexplots")
    Utils.ensureDir(onp + "/")
    i = 1
    with gzip.open(fnp, "r") as f:
        for line in f:
            if i % 100000 == 0: print("working with object %d\r" % i, end="")
            sys.stdout.flush()
            i += 1
            d = json.loads(line)
            for rank in ranks:
                if rank == "confidence": continue
                for cell_line in d["ranks"][rank]:
                    if cell_line not in ranks[rank]: ranks[rank][cell_line] = []
                    ranks[rank][cell_line].append(d["ranks"][rank][cell_line]["rank"])
            ranks["confidence"].append(d["confidence"])
    for i in range(0, len(ranks) - 1):
        for j in range(i + 1, len(ranks) - 1):
            for cell_line in ranks[keys[i]]:
                ofnp = os.path.join(onp, cell_line, "%s_x_%s.png" % (keys[i], keys[j]))
                print("plotting %s" % ofnp)
                hexplot(ranks[keys[i]][cell_line], ranks[keys[j]][cell_line], ofnp)
        for cell_line in ranks[keys[i]]:
            ofnp = os.path.join(onp, cell_line, "confidence_x_%s.png" % keys[i])
            print("producing hexplot for values at %s" % ofnp)
            print("lengths of arrays: %d, %d" % (len(ranks[keys[i]][cell_line]), len(ranks["confidence"])))
            hexplot(ranks[keys[i]][cell_line], ranks["confidence"], ofnp)
        print("wrote to %s" % onp)

if __name__ == "__main__":
    sys.exit(main())
