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
    tissueFixesFnp = os.path.join(os.path.dirname(__file__), "../../celltypes.txt")
    with open(tissueFixesFnp) as f:
        lookup = json.load(f)
    return lookup

def loadRNAcellTypes():
    fnp = os.path.join(os.path.dirname(__file__), "rnaseq_celltype.txt")
    with open(fnp) as f:
        lookup = json.load(f)
    return lookup

def getCellTypes():
    lookup = loadCellTypes()
    rnacts = loadRNAcellTypes()
        
    tissues = set()
    for ct, t in lookup.iteritems():
        tissues.add(t)

    ret = {}
    for t in sorted(list(tissues)):
        ret[t] = {}
        creCTS = set()
        for creCT, creT in lookup.iteritems():
            if t == creT:
                creCTS.add(Utils.sanitize(creCT))
        creCTS = sorted(list(creCTS))
        rnaCTS = set()
        for rnaCT, rnaT in rnacts.iteritems():
            if t == rnaT:
                rnaCTS.add(rnaCT)
        rnaCTS = sorted(list(rnaCTS))
        ret[t]["creCTS"] = sorted(creCTS)
        ret[t]["rnaCTS"] = sorted(rnaCTS)

    fnp = os.path.join(os.path.dirname(__file__), "match.json")
    with open(fnp, 'w') as f:
        json.dump(ret, f)

    keys = sorted(list(ret.keys()))
    for t in keys:
        ctsMix = ret[t]
        delim = ', '
        print('\t'.join([t, delim.join(ctsMix["creCTS"]), delim.join(ctsMix["rnaCTS"])]))
        
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
