#!/usr/bin/env python

import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from helpers_metadata import Exp, QueryDCC
from utils import Utils
from metadataws import MetadataWS
from cache_memcache import MemCacheWrapper

def loadCellTypes():
    tissueFixesFnp = os.path.join(os.path.dirname(__file__), "cellTypeFixesEncode.txt")
    with open(tissueFixesFnp) as f:
        rows = f.readlines()

    lookup = {}
    for idx, r in enumerate(rows):
        toks = r.rstrip().split(',')
        if len(toks) != 2:
            raise Exception("wrong number of tokens on line " + str(idx + 1) +
                            ": " + r + "found " + str(len(toks)))
        lookup[toks[0]] = toks[1].strip()
    return lookup

def getCellTypes():
    url = "https://www.encodeproject.org/search/?searchTerm=rna-seq&type=Experiment&assay_title=RNA-seq&award.project=ENCODE&limit=all&format=json"

    mc = MemCacheWrapper()
    qd = QueryDCC(cache = mc)

    j = json.loads(qd.getURL(url))
    cts = set()
    for e in j["@graph"]:
        cts.add(e["biosample_term_name"])
    cts = sorted(list(cts))
    #print("\n".join(cts))

    lookup = loadCellTypes()

    tissues = set()
    for ct, t in lookup.iteritems():
        tissues.add(t)
        
    for ct in cts:
        if ct in tissues:
            print('"%s" : "%s",' % (ct, ct))
            continue
        ct = ct.replace(' ', '_')
        if ct in lookup:
            print('"%s" : "%s",' % (ct, lookup[ct]))
            continue
        print('"%s" : "",' % ct)
        
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    getCellTypes()
    
    for dataset in [Datasets.all_human]:
        DBCONN = db_connect(os.path.realpath(__file__), args.local)
        with getcursor(DBCONN, "03_genes") as curs:
            pass

if __name__ == '__main__':
    main()
