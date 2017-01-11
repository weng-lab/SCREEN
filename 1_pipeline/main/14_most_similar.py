#!/usr/bin/env python

from __future__ import print_function
import ujson as json
import sys
import os
import requests
import gzip
import argparse
import gc

from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs, Tools, Genome, Datasets
from get_tss import Genes

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms

class _helpers:
    keys = [("dnase", None),
            ("promoter", "H3K4me3-Only"),
            ("promoter", "DNase+H3K4me3"),
            ("enhancer", "H3K27ac-Only"),
            ("enhancer", "DNase+H3K27ac"),
            ("ctcf", "CTCF-Only"),
            ("ctcf", "DNase+CTCF") ]

    @staticmethod
    def _ukey(key):
        return key[0] if key[1] is None else key[1]

    @staticmethod
    def _map_cts(ranks, outerkey, innerkey):
        i = 0
        ret = {}
        for ct, v in ranks[outerkey].iteritems():
            if innerkey is None or innerkey in v:
                ret[ct] = i
                i += 1
        return ret

    @staticmethod
    def compare(a1, a2):
        ret = 0
        for i in xrange(min(len(a1), len(a2))): # lens should always be the same, but just in case...
            ret += 1 if a1[i] == a2[i] else 0
        return ret

    @staticmethod
    def bestappend(best, elem):
        for i in xrange(len(best)):
            if best[i][1] < elem[1]:
                best.insert(i, elem)
                best.pop()
                return

    @staticmethod
    def worstappend(worst, elem):
        for i in xrange(len(worst)):
            if worst[i][1] > elem[1]:
                worst.insert(i, elem)
                worst.pop()
                return

    @staticmethod
    def exacc(bw):
        ret = {"most-similar": {}, "least-similar": {}}
        for k, _ in bw["best"].iteritems():
            ret["most-similar"][k] = [x[0] for x in bw["best"][k]]
            ret["least-similar"][k] = [x[0] for x in bw["worst"][k]]
        return ret

    """
      " initializes a rank binarizer
      " uses a single regulatory element as a prototype to map cell types to indices
    """
    def __init__(self, proto_ranks):
        self.ctmap = {}
        for k in _helpers.keys:
            self.ctmap[_helpers._ukey(k)] = _helpers._map_cts(proto_ranks, k[0], k[1])

    """
      " convert the ranks field from a JSON to a dict of arrays to save memory
      " the array indices may be mapped back to cell type names using this object's ctmap
    """
    def binarize_ranks(self, ranks, threshold = 20000):
        ret = {}
        for key in _helpers.keys:
            cmap = self.ctmap[_helpers._ukey(key)]
            _ret = [0 for i in xrange(len(cmap))]
            if key[1] is None:
                for ct, v in cmap.iteritems():
                    _ret[v] = 1 if ranks[key[0]][ct]["rank"] <= threshold else 0
            else:
                for ct, v in cmap.iteritems():
                    _ret[v] = 1 if ranks[key[0]][ct][key[1]]["rank"] <= threshold else 0
            ret[_helpers._ukey(key)] = _ret
        return ret

def compare(res, i, l, N_ELEMENTS):
    ret = []
    print("@%d: compare" % i)
    for n in range(i, l):
        _ret = {"best": {}, "worst": {}}
        for key in _helpers.keys:
            k = _helpers._ukey(key)
            _ret["worst"][k] = [(None, 1000000) for o in xrange(N_ELEMENTS)]
            _ret["best"][k] = [(None, 0) for o in xrange(N_ELEMENTS)]
            for j in xrange(len(res)):
                dist = _helpers.compare(res[n][1][k], res[j][1][k]) if n != j else len(res[n][1][k])
                _helpers.bestappend(_ret["best"][k], (res[j][0], dist))
                _helpers.worstappend(_ret["worst"][k], (res[j][0], dist))
        ret.append((res[n][0], _ret))
    return ret

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=2)
    parser.add_argument('--version', type=int, default=7)
    parser.add_argument('--assembly', type=str, default="hg19")
    parser.add_argument('--threshold', type=int, default=20000)
    parser.add_argument('--n_elements', type=int, default=50)
    args = parser.parse_args()
    return args

def asum(_as):
    ret = []
    for a in _as: ret += a
    return ret

def main():

    # get args, file paths
    args = parse_args()
    fnps = paths.get_paths(args.version, chroms[args.assembly])
    inps = fnps["rewriteGenePeaksFnp"]
    res = []

    # must have at least one input file present to run
    i = 0
    while i < len(inps) and not os.path.exists(inps[i]):
        i += 1
    if i >= len(inps):
        print("error: none of the input files are present; please run previous steps and try again.")
        return 1

    # construct binarizer based on first present file
    with gzip.open(inps[i], "r") as f:
        ibin = _helpers(json.loads(f.readline())["ranks"])

    # load all regulatory elements and binarize ranks
    for _file in inps:
        if not os.path.exists(_file):
            print("warning: skipping missing file %s" % _file)
            continue
        with gzip.open(_file, "r") as f:
            i = 0
            for line in f:
                j = json.loads(line)
                res.append((j["accession"], ibin.binarize_ranks(j["ranks"], args.threshold)))
                i += 1
                if i % 100000 == 0: print("@%d: load %s" % (i, _file))

    # do comparison, map keys for easy writing
    ngroup = len(res) / args.j + 1
    if args.j > 1:
        _results = asum(Parallel(n_jobs = args.j)(delayed(compare)(res, i * ngroup, (i + 1) * ngroup if i < args.j - 1 else len(res),
                                                                   args.n_elements)
                                                  for i in xrange(0, args.j)))
    else:
        _results = compare(res, 0, len(res), args.n_elements)
    results = {}
    for result in _results:
        results[result[0]] = result[1]

    # write output
    for n in xrange(len(inps)):
        _file = inps[n]
        if not os.path.exists(_file):
            continue
        with gzip.open(_file, "r") as f:
            with gzip.open(fnps["rewriteSimilarFnp"][n], "wb") as o:
                i = 0
                for line in f:
                    j = json.loads(line)
                    j["similar-res"] = _helpers.exacc(results[j["accession"]])
                    o.write(json.dumps(j) + "\n")
                    i += 1
                    if i % 100000 == 0: print("@%d: write %s" % (i, _file))

    return 0

if __name__ == "__main__":
    sys.exit(main())
