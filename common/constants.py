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

chroms = {"hg19": ['chr1', 'chr10', 'chr11', 'chr12', 'chr13',
                   'chr14', 'chr15', 'chr16', 'chr17', 'chr18',
                   'chr19', 'chr2', 'chr20', 'chr21', 'chr22',
                   'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8',
                   'chr9', 'chrX', 'chrY'], #'chrM'
          "mm10": ['chr1', 'chr10', 'chr11', 'chr12', 'chr13',
                   'chr14', 'chr15', 'chr16', 'chr17', 'chr18',
                   'chr19', 'chr2',
                   'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8',
                   'chr9', 'chrX', 'chrY'] } # chrM

chrom_lengths = {"hg19": {"chr1": 249250621, "chr2": 243199373, "chr3": 198022430, "chr4": 191154276,
                          "chr5": 180915260, "chr6": 171115067, "chr7": 159138663, "chrX": 155270560,
                          "chr8": 146364022, "chr9": 141213431, "chr10": 135534747, "chr11": 135006516,
                          "chr12": 133851895, "chr13": 115169878, "chr14": 107349540, "chr15": 102531392,
                          "chr16": 90354753, "chr17": 81195210, "chr18": 78077248, "chr20": 63025520,
                          "chrY": 59373566, "chr19": 59128983, "chr22": 51304566, "chr21": 48129895 },
                 "mm10" : {"chr1": 195471971, "chr2":182113224, "chrX": 171031299, "chr3" : 160039680,
                           "chr4":156508116, "chr5":151834684, "chr6":149736546, "chr7":145441459,
                           "chr10":130694993, "chr8":129401213, "chr14":124902244, "chr9":124595110,
                           "chr11":122082543, "chr13":120421639, "chr12":120129022, "chr15":104043685,
                           "chr16":98207768, "chr17":94987271, "chrY":91744698, "chr18":90702639,
                           "chr19":61431566, "chrM":16299}}

class helptext:
    docid = "1fWphK-WAyk65d1WO8s0yBqO-_YiD2JdQwlkB3ZqqsYI"
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "googleapi", "helptext.txt")

class paths:
    v4d = os.path.join(Dirs.encyclopedia, "Version-4")

    @staticmethod
    def bigwigmaxes(assembly):
        return os.path.join(paths.v4d, "%s_bigwig.tsv" % assembly)

    def insChr(fnp):
        def addChr(chrom):
            toks = fnp.split(".")
            return "%s.%s.%s" % (toks[0], chrom, ".".join(toks[1:]))
        return addChr

    cytobands = {
        "hg19": os.path.join(v4d, "ucsc.hg19.cytoBand.txt.gz"),
        "mm10": os.path.join(v4d, "ucsc.mm10.cytoBand.txt.gz")}


    re_json_vers = {
        9: { "hg19" : {"base" : os.path.join(v4d, "ver9/hg19"),
                       "newway": os.path.join(v4d, "ver9/hg19/newway")
                       },
             "mm10" : {"base" : os.path.join(v4d, "ver9/mm10"),
                       "newway": os.path.join(v4d, "ver9/mm10/newway")
                       }
             }
        }

    @staticmethod
    def getCREs(version, assembly):
        return paths.re_json_vers[version][assembly]

    @staticmethod
    def get_paths(version, assembly):
        chrs = chroms[assembly]
        ret = {}
        if version not in paths.re_json_vers:
            return ret
        fnps = paths.re_json_vers[version][assembly]
        for k, v in fnps.iteritems():
            if not hasattr(v, "__call__"):
                ret[k] = v
            else:
                ret[k] = [v(chrom) for chrom in chrs]
        return ret

    hexplots_dir = os.path.join(v4d, "hexplots")
    gene_files = {"hg19": (Dirs.GenomeFnp("gencode.v19/gencode.v19.annotation.gff3.gz"), "gff"),
                  "mm10" : (Dirs.GenomeFnp("gencode.m4/gencode.vM4.annotation.gtf.gz"), "gtf") }

    genelist = {"hg19" : os.path.join(v4d, "genelist.hg19.tsv"),
                "mm10" : os.path.join(v4d, "genelist.mm10.tsv")}
    genelsj = {"hg19" : os.path.join(v4d, "genelist.hg19.lsj"),
               "mm10" : os.path.join(v4d, "genelist.mm10.lsj")}
    geneJsonFnp = {"hg19" : os.path.join(v4d, "genelist.hg19.json"),
                   "mm10" : os.path.join(v4d, "genelist.mm10.json")}

    genedb = os.path.join(v4d, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.json.gz")
    genedb_lsj = os.path.join(v4d, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.lsj.gz")
    snp_csvs = {"mm10" : os.path.join(Dirs.dbsnps, "snps142common.mm10.csv"),
                "hg19" : os.path.join(Dirs.dbsnps, "snps144common.hg19.csv")}
    snp_lsjs = {"mm10" : os.path.join(v4d, "snplist.mm10.lsj.gz"),
                "hg19" : os.path.join(v4d, "snplist.hg19.lsj.gz")}

    reVer = 7
    reVerStr = "reVer" + str(reVer)

    @staticmethod
    def reJsonIndex(assembly):
        # TODO: fixme!
        if "hg19" == assembly:
            return "regulatory_elements_" + "7" #str(paths.reVer)
        return "regulatory_elements_8_mm10" #" + str(paths.reVer) + "_" + assembly

    @staticmethod
    def IndexCellTypesAndTissues(assembly):
        r = {"hg19" : "cellTypesAndTissues_hg19",
             "mm10" : "cellTypesAndTissues_mm10"}
        return r[assembly]

def main():
    fnps = paths.get_paths(7, chroms["hg19"])

    inFnps = fnps["rewriteGeneFnp"]
    for fnp in inFnps:
        print(fnp)

if __name__ == '__main__':
    sys.exit(main())

