#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect
from config import Config

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange, makeIndexMultiCol
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import AddPath, Utils, printt

AddPath(__file__, '../../common/')
from dbconnect import db_connect
from constants import chroms, paths, DB_COLS
from config import Config

def setupAndCopy(cur, assembly, fnp):
    tableName = "r_expression_" + assembly

    printt("dropping and creating", tableName)
    cur.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName} (
ensembl_id VARCHAR(256) NOT NULL,
gene_name VARCHAR(256) NOT NULL,
dataset VARCHAR(256) NOT NULL,
replicate INT NOT NULL,
fpkm NUMERIC NOT NULL,
tpm NUMERIC NOT NULL);
    """.format(tableName = tableName))

    printt("importing", fnp)
    with gzip.open(fnp) as f:
        cur.copy_from(f, tableName, ',',
                      columns=("ensembl_id", "gene_name", "dataset",
                               "replicate", "fpkm", "tpm"))

def doIndex(curs, assembly):
    tableName = "r_expression_" + assembly
    makeIndex(curs, tableName, ["gene_name"])

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--index', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    d = os.path.join(Dirs.encyclopedia, "roderic/public_docs.crg.es/rguigo/encode/expressionMatrices/")
    fnps = {}
    fnps["hg19"] = os.path.join(d, "H.sapiens/hg19/2016_10/gene.human.V19.hg19.RNAseq.2016_10_08.json.gz")
    fnps["mm10"] = os.path.join(d, "M.musculus/mm10/2016_10/gene.mouse.M4.mm10.RNAseq.2016_10_07.json.gz")

    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        inFnp = fnps[assembly]
        outFnp = inFnp + ".csv.gz"

        if not os.path.exists(outFnp):
            printt("missing", outFnp)
            cmds = [os.path.join(os.path.dirname(__file__),
                                 "json_parser/bin/read_json"),
                    inFnp]
            print("writing csv from", inFnp)
            Utils.runCmds(cmds)

        DBCONN = db_connect(os.path.realpath(__file__))
        with getcursor(DBCONN, "08_setup_log") as curs:
            if args.index:
                doIndex(curs, assembly)
            else:
                print("using", outFnp)
                setupAndCopy(curs, assembly, outFnp)
                doIndex(curs, assembly)

if __name__ == '__main__':
    main()
