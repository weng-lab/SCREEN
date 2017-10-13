#!/usr/bin/env python

import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../common"))
from constants import paths


class FCPaths:
    base = paths.fantomcat
    genetsv = os.path.join(base, "gene.info.tsv")
    genesdir = os.path.join(base, "genes")
    genebed = os.path.join(base, "gene.info.bed")
    intersected = os.path.join(base, "gene.info.intersected.bed")
    global_statistics = os.path.join(base, "global_statistics.json")
    cres = paths.path("hg19", "raw/cREs.sorted.bed.gz")
    twokb = os.path.join(base, "gene.2kbtss.bed")
    twokb_intersected = os.path.join(base, "gene.2kbtss.intersected.bed")
    twokb_statistics = os.path.join(base, "twokb_statistics.json")
    forimport = {
        "genes": os.path.join(base, "gene.import.tsv"),
        "intersections": os.path.join(base, "intersections.tsv"),
        "twokb_intersections": os.path.join(base, "twokb.intersections.tsv")
    }
    zenbu_track = os.path.join(base, "web_zenbu_downloads", "5BFANTOMCAT5DRobustgene.bed")

    @staticmethod
    def genepath(acc):
        return os.path.join(FCPaths.genesdir, acc + ".json")
