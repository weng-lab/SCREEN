import sys, os
import argparse

from elasticsearch import Elasticsearch
import psycopg2, psycopg2.pool
import subprocess
import glob

sys.path.append(os.path.join(os.path.dirname(__file__), "../../website/common"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../website"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from models.biosamples import Biosamples
from constants import paths, chroms
from cached_objects import CachedObjectsWrapper
from elastic_search_wrapper import ElasticSearchWrapperWrapper
from postgres_wrapper import PostgresWrapper
from dbconnect import db_connect

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="hg19")
    parser.add_argument('--version', type=int, default=7)    
    return parser.parse_args()

def get_maxsignal(targetfile, chrs, v):
    signals = []
    for _chr in chrs:
        try:
            r = subprocess.check_output(["/project/umw_zhiping_weng/0_metadata/tools/ucsc.v287/bigWigSummary", targetfile, _chr, "0", "250000000", "1", "-type=max"])
            signals.append(int(r))
        except:
            print("WARNING: failed to get data for %s:%s; skipping" % (targetfile, _chr))
    return max(signals) if len(signals) > 0 else 0

def main():
    args = parse_args()
    es = ElasticSearchWrapperWrapper(Elasticsearch())
    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    ps = PostgresWrapper(DBCONN)
    cache = CachedObjectsWrapper(es, ps)[args.assembly]
    cts = cache.cellTypesAndTissues
    _map = {}
    i = 1

    results = []
    with open(os.path.expanduser("~/git/regElmViz/list.txt"), "r") as f:
        for line in f:
            line = line.strip().split("\t")
            results.append({"accession": line[0],
                            "bigwig": line[1] })
    
    # use first element to get bigwig paths
    result = es[args.assembly].search(body={"query": {"bool": {"must": [{"match": {"accession": "EE0000001"}}]}},
                                            "_source": ["ranks"]},
                                      index=paths.re_json_vers[args.version][args.assembly]["index"])["hits"]["hits"]
    if len(result) == 0:
        print("ERROR: failed to find first element, required to load bigwig paths; aborting")
        return 1
    result = result[0]

    # for each BigWig, get maximum
    maxes = {}
    for v in results:
        for targetfile in glob.glob(os.path.join("/project/umw_zhiping_weng/0_metadata/encode/data/%s/*.bigWig" % (v["accession"]))):
#        targetfile = os.path.join("/project/umw_zhiping_weng/0_metadata/encode/data/%s/%s.bigWig" % (v["accession"], v["bigwig"]))
            if not os.path.exists(targetfile):
                print("WARNING: file %s does not exist; skipping" % targetfile)
                continue
            maxes[v["bigwig"]] = get_maxsignal(targetfile, chroms[args.assembly], v)
            if maxes[v["bigwig"]] == 0:
                print("WARNING: max signal of 0 for %s" % targetfile)

    print(maxes)

    with open(os.path.expanduser("~/bigwig.tsv"), "wb") as o:
        for bigwig, _max in maxes.iteritems():
            o.write("%s\t%d\n" % (bigwig, _max))
    print("wrote /project/umw_zhiping_weng/0_metadata/encyclopedia/bigwig.tsv")

if __name__ == '__main__':
    sys.exit(main())
