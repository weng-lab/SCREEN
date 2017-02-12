#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from get_tss import Genes
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, printWroteNumLines, printt

class NearestGenes:
    def __init__(self, assembly):
        self.assembly = assembly

    def getEnsembleToInfo(self):
        if "mm10" == self.assembly:
            return self.processGeneListMm10()
        if "hg19" == self.assembly:
            return self.processGeneListHg19()
        raise Exception("unknown assembly: " + self.assembly)

    def geneToCoord(self):
        fnp, filetype = paths.gene_files[self.assembly]
        printt("loading", fnp)
        ggff = Genes(fnp, filetype)
        ret = {}
        for g in ggff.getGenes():
            ret[g.geneid_] = [g.chr_, g.start_, g.end_, g.genename_, g.genetype_]
        #print(set([v[4] for k,v in ret.iteritems()]))
        return ret

    def run(self):
        printt(self.assembly, "getting gene coordinates...")
        geneCoords = self.geneToCoord()
        d = os.path.join("/project/umw_zhiping_weng/0_metadata/encyclopedia/",
                         "Version-4", "ver9", self.assembly)
        Utils.mkdir_p(d)

        # "all genes"
        fnp = os.path.join(d, "extras", "all_genes.bed")
        with open(fnp, 'w') as f:
            for ensembli, coord in geneCoords.iteritems():
                f.write('\t'.join([coord[0], str(coord[1]), str(coord[2]), ensembli, coord[3]]) + '\n')
        printWroteNumLines(fnp)
        Utils.sortFile(fnp)
        Utils.sortFile(os.path.join(d, "raw", "masterPeaks.bed"),
                       os.path.join(d, "raw", "masterPeaks.sorted.bed"))

        cmds = ["bedtools closest",
                "-a", os.path.join(d, "raw", "masterPeaks.sorted.bed"),
                "-b", fnp,
                "-k 5 -d",
                '|', "gzip",
                '>', os.path.join(d, "raw", "all_cre_genes.bed.gz")]
        Utils.runCmds(cmds)
        printWroteNumLines(os.path.join(d, "raw", "all_cre_genes.bed.gz"))

        # "pc genes"
        fnp = os.path.join(d, "extras", "pc_genes.bed")
        with open(fnp, 'w') as f:
            for ensembli, coord in geneCoords.iteritems():
                if coord[4] == 'protein_coding':
                    f.write('\t'.join([coord[0], str(coord[1]), str(coord[2]), ensembli, coord[3]]) + '\n')
        printWroteNumLines(fnp)
        Utils.sortFile(fnp)

        cmds = ["bedtools closest",
                "-a", os.path.join(d, "raw", "masterPeaks.sorted.bed"),
                "-b", fnp,
                "-k 5 -d",
                '|', "gzip",
                '>', os.path.join(d, "raw", "pc_cre_genes.bed.gz")]
        Utils.runCmds(cmds)
        printWroteNumLines(os.path.join(d, "raw", "pc_cre_genes.bed.gz"))

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    for assembly in ["mm10", "hg19"]:
        ng = NearestGenes(assembly)
        ng.run()

    return 0

if __name__ == '__main__':
    main()
