import sys
import os
import argparse

from elasticsearch import Elasticsearch

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from postgres_wrapper import PostgresWrapper
from elastic_search_wrapper import ElasticSearchWrapper
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), "../../website/common"))
from compute_gene_expression import ComputeGeneExpression
from coord import Coord

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor

def _unpack_tuple_array(a):
    return ([i[0] for i in a], [i[1] for i in a])

class ResolveAlias:
    def __init__(self, es):
        self.es = es

    def resolve(self, s):
        gene_suggestions, gene_results = self.es.gene_aliases_to_coordinates(s)
        gene_toks, gene_coords = _unpack_tuple_array(gene_results)
        if len(gene_coords) > 0:
            return Coord.parse(gene_coords[-1])
        return None

class DB:
    def __init__(self, DBCONN, assembly):
        self.DBCONN = DBCONN
        self.assembly = assembly

    def recreate_tables(self):
        with getcursor(self.DBCONN, "DB::recreate_tables") as curs:
            curs.execute("DROP TABLE IF EXISTS %s_de" % self.assembly)
            curs.execute("""CREATE TABLE %s_de
                            ( id serial PRIMARY KEY,
                              ct1 text, ct2 text, gene text,
                              chr text, start integer, _end integer,
                              fold_change decimal )""" % self.assembly)

    def get_celltypes(self):
        with getcursor(self.DBCONN, "DB::get_celltypes") as curs:
            curs.execute("""SELECT celltype FROM r_rnas""")
            return [x[0] for x in curs.fetchall()]

    def insert_value(self, ct1, ct2, gene, _chr, start, end, fold_change):
        with getcursor(self.DBCONN, "DB::insert_totals") as curs:
            curs.execute("""INSERT INTO {assembly}_de (ct1, ct2, gene, chr, start, _end, fold_change)
                                         VALUES (%(ct1)s, %(ct2)s, %(gene)s, %(chr)s, %(start)s, %(end)s, %(fold_change)s)""".format(assembly = self.assembly),
                         {"ct1": ct1, "ct2": ct2, "gene": gene, "chr": _chr, "start": start, "end": end, "fold_change": fold_change})

def parseargs():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument("--assembly", type=str, default="hg19")
    return parser.parse_args()
            
def main():
    args = parseargs()
    inserted = 0

    # connect to DB
    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    db = DB(DBCONN, args.assembly)
    db.recreate_tables()
    ps = PostgresWrapper(DBCONN)
    es = ElasticSearchWrapper(Elasticsearch())
    cg = ComputeGeneExpression(es, ps, None)

    # for mapping genes to coordinates
    coord_map = {}
    alias = ResolveAlias(es)
    
    # get all celltypes, loop through pairs
    cts = db.get_celltypes()
    for i in xrange(len(cts)):
        for j in range(i + 1, len(cts)):
            print("computing differential expression for %s/%s" % (cts[i], cts[j]))
            count = 0
            fcs = cg.computeFoldChange(cts[i], cts[j])
            for gene, fc in fcs.iteritems():
                if gene not in coord_map:
                    coord_map[gene] = alias.resolve(gene)
                if coord_map[gene] is None:
                    print("error: cannot map %s to coordinate; skipping" % gene)
                    continue
                pos = coord_map[gene]
                db.insert_value(cts[i], cts[j], gene, pos.chrom, pos.start, pos.end, fc)
                count += 1
            print("inserted %d items" % count)

    return 0

if __name__ == "__main__":
    sys.exit(main())
