#!/usr/bin/env python

from __future__ import print_function

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../metadata/utils"))
from files_and_paths import Dirs
from v4_config import V4Config

def PageTitle(assembly):
    if assembly > "":
        return "SCREEN (%s): Search Candidate Regulatory Elements by ENCODE" % assembly
    return "SCREEN: Search Candidate Regulatory Elements by ENCODE"


chrom_lengths = {"hg19": {"chr1": 249250621, "chr2": 243199373,
                          "chr3": 198022430, "chr4": 191154276,
                          "chr5": 180915260, "chr6": 171115067,
                          "chr7": 159138663, "chrX": 155270560,
                          "chr8": 146364022, "chr9": 141213431,
                          "chr10": 135534747, "chr11": 135006516,
                          "chr12": 133851895, "chr13": 115169878,
                          "chr14": 107349540, "chr15": 102531392,
                          "chr16": 90354753, "chr17": 81195210,
                          "chr18": 78077248, "chr20": 63025520,
                          "chrY": 59373566, "chr19": 59128983,
                          "chr22": 51304566, "chr21": 48129895 },
                 "mm10" : {"chr1": 195471971, "chr2":182113224,
                           "chrX": 171031299, "chr3" : 160039680,
                           "chr4":156508116, "chr5":151834684,
                           "chr6":149736546, "chr7":145441459,
                           "chr10":130694993, "chr8":129401213,
                           "chr14":124902244, "chr9":124595110,
                           "chr11":122082543, "chr13":120421639,
                           "chr12":120129022, "chr15":104043685,
                           "chr16":98207768, "chr17":94987271,
                           "chrY":91744698, "chr18":90702639,
                           "chr19":61431566}}

chroms = {"hg19": chrom_lengths["hg19"].keys(),
          "mm10": chrom_lengths["mm10"].keys()}

class helptext:
    docid = "1fWphK-WAyk65d1WO8s0yBqO-_YiD2JdQwlkB3ZqqsYI"
    path = os.path.join(os.path.dirname(__file__), "../",
                        "googleapi", "helptext.txt")

V4d = os.path.join(Dirs.encyclopedia, "Version-4")
CreVer = 9
CreVerStr = "ver" + str(CreVer)

class paths(object):
    creVer = CreVer
    creVerStr = CreVerStr
    v4d = V4d

    @staticmethod
    def path(assembly, *args):
        #print('\n'.join([V4d, CreVerStr, assembly] + list(args)))
        return os.path.join(V4d, CreVerStr, assembly, *args)

    def dBase(assembly, *args):
        return os.path.join(V4d, CreVerStr, assembly, *args)

    cytobands = {
        "hg19": os.path.join(v4d, "ucsc.hg19.cytoBand.txt.gz"),
        "mm10": os.path.join(v4d, "ucsc.mm10.cytoBand.txt.gz")}

    re_json_vers = {
        9: { "hg19" : {"base" : dBase("hg19"),
                       "newway": dBase("hg19", "newway")
                       },
             "mm10" : {"base" : dBase("mm10"),
                       "newway": dBase("mm10", "newway")
                       }
             }
        }

    hgncFnp = os.path.join(V4d, "hgnc", "hgnc_complete_set.txt")

    gene_files = {
        "hg19": (Dirs.GenomeFnp("gencode.v19/gencode.v19.annotation.gff3.gz"), "gff"),
        "mm10" : (Dirs.GenomeFnp("gencode.m4/gencode.vM4.annotation.gtf.gz"), "gtf") }

def main():
    print(paths.re_json_vers)

if __name__ == '__main__':
    sys.exit(main())

