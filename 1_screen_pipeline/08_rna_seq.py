#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import ujson as json
import argparse
import fileinput
import StringIO
import gzip
import random
import arrow
from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt, printWroteNumLines, eprint
from cache_memcache import MemCacheWrapper
from querydcc import QueryDCC
from metadataws import MetadataWS
from files_and_paths import Datasets, Dirs
from exp import Exp

AddPath(__file__, '../common/')
from constants import paths, chroms
from common import printr, printt
from config import Config

mc = MemCacheWrapper("127.0.0.1")
qd = QueryDCC(cache=mc)

class ExtractRNAseq:
    def __init__(self, assembly):
        self.assembly = assembly
        geneIdIdxs = {"hg19": 0, "mm10": 0}
        self.gene_id_idx = geneIdIdxs[self.assembly]

    def run(self):
        today = arrow.now().format('YYYY-MM-DD')
        fnp = paths.path(self.assembly, "geneExp", today + ".tsv.gz")
        Utils.ensureDir(fnp)
        with gzip.open(fnp, 'wb') as f:
            for row in self._getRowsFromFiles():
                f.write('\t'.join(row) + '\n')
        printWroteNumLines(fnp)
        
    def _getRowsFromFiles(self):
        counter = 0
        for exp, expF in self._getFiles():
            counter += 1
            printt(counter, exp.encodeID, expF.fileID, expF.biological_replicates, expF.output_type)
            try:
                with open(expF.fnp()) as f:
                    lines = [x.strip().split('\t') for x in f]
                header = lines[0]
                gene_id_idx = self.gene_id_idx
                TPM_idx = 5 
                FPKM_idx = 6
                assert("gene_id" == header[gene_id_idx])
                assert("TPM" == header[TPM_idx])
                assert("FPKM" == header[FPKM_idx])
                for row in lines[1:]:
                    if "0.00" == row[TPM_idx] and "0.00" == row[FPKM_idx]:
                        continue
                    yield(expF.expID, expF.fileID, row[gene_id_idx], 
                          '_'.join([str(x) for x in expF.biological_replicates]),
                          row[TPM_idx], row[FPKM_idx])
            except:
                eprint("error reading:", expF.fnp())
                raise

    def _getFiles(self):
        url = "https://www.encodeproject.org/search/?"
        url += "searchTerm=rna-seq&type=Experiment&assay_title=total+RNA-seq"
        url += "&assembly=" + self.assembly + "&files.file_type=tsv"
        url += "&award.project=ENCODE&award.project=Roadmap"
        url += "&format=json&limit=all"

        for exp in qd.getExps(url):
            for expF in exp.files:
                if not expF.isTSV():
                    continue
                if expF.assembly != self.assembly:
                    continue
                expF.download()
                if expF.isGeneQuantifications():
                    yield(exp, expF)

def run(args):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        rs = ExtractRNAseq(assembly)
        rs.run()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    return run(args)

if __name__ == '__main__':
    main()
