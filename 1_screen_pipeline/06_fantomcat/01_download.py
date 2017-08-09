#!/usr/bin/env python

from __future__ import print_function

import sys, os

from fc_common import FCPaths

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../../metadata/utils"))
from utils import Utils

class Downloader:
    def __init__(self, tsvsource, geneurl_f):
        self._geneurl_f = geneurl_f
        self._infopath = FCPaths.genetsv
        Utils.download(tsvsource, self._infopath)
        self._download_genejson()
    def _download_genejson(self):
        with open(self._infopath, "r") as f:
            for line in f:
                line = line.strip().split("\t")
                Utils.download(self._geneurl_f(line[0]), FCPaths.genepath(line[0]))

def main():
    Downloader("http://fantom.gsc.riken.jp/cat/v1/data/version_20161015.gene.master.tsv",
               lambda acc: "http://fantom.gsc.riken.jp/cat/v1/data/gene_json/%s.json" % acc)
    return 0

if __name__ == "__main__":
    sys.exit(main())
