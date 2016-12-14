#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, makehash

class CopyIn:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN
        
    def setupDb(self, cur):
        cur.execute("""
    DROP TABLE IF EXISTS r_expression;

    CREATE TABLE r_expression(
        assembly text,
        gene_transcript text,
        typ text,
        ensembl_id VARCHAR(256) NOT NULL,
        gene_name VARCHAR(256) NOT NULL,
        dataset VARCHAR(256) NOT NULL,
        replicate INT NOT NULL,
        fpkm NUMERIC NOT NULL,
        tpm NUMERIC NOT NULL);
    """)

    def copyIn(self, cur, assembly, fnp):
        with gzip.open(fnp) as f:
            cur.copy_from(f, "r_expression", ',',
                          columns=("assembly", "gene_transcript", "typ", "ensembl_id", "gene_name", "dataset", "replicate", "fpkm", "tpm"))
        print("imported", fnp)

    def process(self, assembly, inFnp, t):
        binFnp = os.path.join(os.path.dirname(__file__), "json_parser/bin/read_json") 
        outFnp = inFnp + ".csv.gz"
        if not os.path.exists(outFnp):
            cmds = [binFnp, inFnp, assembly, t[0], t[1]]
            print("writing csv from", inFnp)
            Utils.runCmds(cmds)
        else:
            print("using", outFnp)

        with getcursor(self.DBCONN, "08_setup_log") as curs:
            self.copyIn(curs, assembly, outFnp)

    def run(self):
        d = "/project/umw_zhiping_weng/0_metadata/roderic/public_docs.crg.es/rguigo/encode/expressionMatrices/"

        with getcursor(self.DBCONN, "08_setup_log") as curs:
            self.setupDb(curs)

        fnps = {}
        for t in [("gene", "RBP_disruption", "gene.human.V19.hg19.RBP_disruption.2016_11_23.json.gz"),
                  ("gene", "RNAseq", "gene.human.V19.hg19.RNAseq.2016_11_23.json.gz"),
                  ("gene", "RNAseq.polyAdepleted", "gene.human.V19.hg19.RNAseq.polyAdepleted.2016_11_23.json.gz"),
                  ("gene", "RNAseq.polyAselected", "gene.human.V19.hg19.RNAseq.polyAselected.2016_11_23.json.gz"),
                  ("gene", "single", "gene.human.V19.hg19.single.2016_11_23.json.gz"),
                  ("gene", "RAMPAGE", "gene.V19.hg19.RAMPAGE.2016_11_23.json.gz"),
                  ("transcript", "RBP_disruption", "transcript.human.V19.hg19.RBP_disruption.2016_11_23.json.gz"),
                  ("transcript", "RNAseq", "transcript.human.V19.hg19.RNAseq.2016_11_23.json.gz"),
                  ("transcript", "RNAseq.polyAdepleted", "transcript.human.V19.hg19.RNAseq.polyAdepleted.2016_11_23.json.gz"),
                  ("transcript", "RNAseq.polyAselected", "transcript.human.V19.hg19.RNAseq.polyAselected.2016_11_23.json.gz"),
                  ("transcript", "single", "transcript.human.V19.hg19.single.2016_11_23.json.gz")]:
            fnp = os.path.join(d, "H.sapiens/hg19/2016_11", t[2])
            self.process("hg19", fnp, t)

        for t in [("gene", "RBP_disruption", "gene.human.V24.GRCh38.RBP_disruption.2016_11_23.json.gz"),
                  ("gene", "RNAseq", "gene.human.V24.GRCh38.RNAseq.2016_11_23.json.gz"),                    
                  ("gene", "RNAseq.polyAdepleted", "gene.human.V24.GRCh38.RNAseq.polyAdepleted.2016_11_23.json.gz"),
                  ("gene", "RNAseq.polyAselected", "gene.human.V24.GRCh38.RNAseq.polyAselected.2016_11_23.json.gz"),
                  ("gene", "single", "gene.human.V24.GRCh38.single.2016_11_23.json.gz"),
                  ("gene", "RAMPAGE", "gene.V24.GRCh38.RAMPAGE.2016_11_23.json.gz"),
                  ("transcript", "RBP_disruption", "transcript.human.V24.GRCh38.RBP_disruption.2016_11_23.json.gz"),
                  ("transcript", "RNAseq", "transcript.human.V24.GRCh38.RNAseq.2016_11_23.json.gz"),
                  ("transcript", "RNAseq.polyAdepleted", "transcript.human.V24.GRCh38.RNAseq.polyAdepleted.2016_11_23.json.gz"),
                  ("transcript", "RNAseq.polyAselected", "transcript.human.V24.GRCh38.RNAseq.polyAselected.2016_11_23.json.gz"),
                  ("transcript", "single", "transcript.human.V24.GRCh38.single.2016_11_23.json.gz")]:
            fnp = os.path.join(d, "H.sapiens/GRCh38/2016_11", t[2])
            self.process("GRCh38", fnp, t)

        for t in [("gene", "RNAseq", "gene.mouse.M4.mm10.RNAseq.2016_11_23.json.gz"),
                  ("gene", "RNAseq.polyAselected", "gene.mouse.M4.mm10.RNAseq.polyAselected.2016_11_23.json.gz"),
                  ("gene", "single", "gene.mouse.M4.mm10.single.2016_11_23.json.gz"),
                  ("transcript", "RNAseq", "transcript.mouse.M4.mm10.RNAseq.2016_11_23.json.gz"),
                  ("transcript", "RNAseq.polyAselected", "transcript.mouse.M4.mm10.RNAseq.polyAselected.2016_11_23.json.gz"),
                  ("transcript", "single", "transcript.mouse.M4.mm10.single.2016_11_23.json.gz")]:
            fnp = os.path.join(d, "M.musculus/mm10/2016_11/", t[2])
            self.process("mm10", fnp, t)
    
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    copyin = CopyIn(DBCONN)
    copyin.run()
    
if __name__ == '__main__':
    main()
