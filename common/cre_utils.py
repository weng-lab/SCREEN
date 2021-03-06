
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../metadata/utils"))
from utils import AddPath

AddPath(__file__, "..")
from config import Config

from constants import chroms


def isaccession(s):
    if len(s) != 12:
        return False
    s = s.lower()
    # TODO: double check using regex
    return (s.startswith("eh37e") or s.startswith("em10e") or s.startswith("eh38e"))


def isclose(a, b, rel_tol=1e-09, abs_tol=0.0):
    # from http://stackoverflow.com/a/33024979
    return abs(a - b) <= max(rel_tol * max(abs(a), abs(b)), abs_tol)


def checkChrom(assembly, j):
    chrom = j.get("coord_chrom", None)
    if chrom and chrom not in chroms[assembly]:
        raise Exception("unknown chrom")
    return chrom


def checkAssembly(assembly):
    if assembly not in Config.assemblies and assembly not in Config.partial_assemblies:
        raise Exception("assembly %s is not valid." % assembly)


def checkCreAssembly(assembly, accession):
    starts = {"mm10": "em10e",
              "hg19": "eh37e",
              "GRCh38": "eh38e"}
    return accession.startswith(starts[assembly])

def getAssemblyFromCre(accession):
    cre = accession.lower()
    if cre.startswith("eh37e"):
        return "hg19"
    if cre.startswith("em10e"):
        return "mm10"
    if cre.startswith("eh38e"):
        return "hg38"
    return None
