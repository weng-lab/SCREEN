import sys
import os
import argparse

from elasticsearch import Elasticsearch

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from postgres_wrapper import PostgresWrapper
from elastic_search_wrapper import ElasticSearchWrapper
from dbconnect import db_connect
from constants import paths, chroms

sys.path.append(os.path.join(os.path.dirname(__file__), "../../website/common"))
from compute_gene_expression import ComputeGeneExpression
from coord import Coord

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from get_tss import Genes

def _unpack_tuple_array(a):
    return ([i[0] for i in a], [i[1] for i in a])

class ResolveAlias:
    def __init__(self, es, assembly):
        self.es = es
        self.genemap = self._get_gene_map(assembly)
        self.symbolmap = self._map_symbols(assembly)

    def _get_gene_map(self, assembly):
        if assembly not in paths.gene_files:
            print("WARNING: cannot get gene coordinates for assembly",
                  assembly, "-- no gene file found")
            return
        fnp, filetype = paths.gene_files[assembly]
        ggff = Genes(fnp, filetype)
        ret = {}
        for g in ggff.getGenes():
            ret[g.genename_] = Coord.parse("%s:%s-%s" % (g.chr_, g.start_, g.end_))
        return ret

    def _map_symbols(self, assembly):
        ret = {}
        with open(paths.genelist[assembly], "r") as f:
            for idx, line in enumerate(f):
                if idx == 0:
                    continue
                line = line.strip().split("\t")
                while len(line) < 19:
                    line.append("")
                geneobj = {"ensemblid": line[9].strip(),
                           "HGNC_ID": line[0],
                           "approved_symbol": line[1],
                           "approved_name": line[2],
                           "previous_symbols": line[4].split(","),
                           "synonyms": line[5].split(","),
                           "accession_numbers": line[7],
                           "RefSeq_ID": line[10],
                           "UniProt_ID": line[14],
                           "Vega_ID": line[16],
                           "UCSC_ID": line[17],
                           "mouse_genome_ID": line[18] }
                if geneobj["approved_symbol"] not in self.genemap:
                    continue
                for k, v in geneobj.iteritems():
                    if k == "previous_symbols" or k == "synonyms": continue
                    if v.strip() != "":
                        ret[v] = geneobj["approved_symbol"]
        return ret

    def resolve(self, s):
        if s not in self.symbolmap:
            return None
        return self.genemap[self.symbolmap[s]]

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
    alias = ResolveAlias(es, args.assembly)
    
    # get all celltypes, loop through pairs
    cts = db.get_celltypes()
    for i in xrange(len(cts)):
        for j in range(i + 1, len(cts)):
            print("computing differential expression for %s/%s" % (cts[i], cts[j]))
            count = 0
            fcs = cg.computeFoldChange(cts[i], cts[j])
            for gene, fc in fcs.iteritems():
                pos = alias.resolve(gene)
                if pos is None:
                    print("error: cannot map %s to coordinate; skipping" % gene)
                    continue
                db.insert_value(cts[i], cts[j], gene, pos.chrom, pos.start, pos.end, fc)
                count += 1
            print("inserted %d items" % count)

    return 0

if __name__ == "__main__":
    sys.exit(main())
