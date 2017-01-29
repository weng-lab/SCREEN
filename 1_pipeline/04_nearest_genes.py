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
from utils import Utils

class NearestGenes:
    def __init__(self, assembly):
        self.assembly = assembly
        self.gene_files = paths.gene_files

    def getEnsembleToInfo(self):
        if "mm10" == self.assembly:
            return self.processGeneListMm10()
        if "hg19" == self.assembly:
            return self.processGeneListHg19()
        raise Exception("unknown assembly: " + self.assembly)

    def geneToCoord(self):
        if self.assembly not in self.gene_files:
            raise Exception("ERROR: cannot get gene coordinates for assembly " +
                            self.assembly + "-- no gene file found")
        fnp, filetype = self.gene_files[self.assembly]
        ggff = Genes(fnp, filetype)
        ret = {}
        for g in ggff.getGenes():
            # , genename_)
            ret[g.geneid_] = (g.chr_, g.start_, g.end_)
        return ret

    def run(self):
        print(self.assembly, "getting gene coordinates...")
        geneCoords = self.geneToCoord()

        d = os.path.join("/project/umw_zhiping_weng/0_metadata/encyclopedia/",
                         "Version-4", "ver9", self.assembly, "extras")
        Utils.mkdir_p(d)
        fnp = os.path.join(d, "genes.bed")

        with open(fnp, 'w') as f:
            for ensembli, coord in geneCoords.iteritems():
                f.write('\t'.join(coord + [ensembli]) + '\n')
        print("wrote", outFnp)

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
