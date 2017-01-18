#!/usr/bin/env python

import sys
import os
from natsort import natsorted

from coord import Coord

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from db_utils import getcursor

class PGsearchWrapper:
    def __init__(self, pg):
        self.pgs = {
            "hg19" : PGsearch(pg, "hg19"),
            "mm10" : PGsearch(pg, "mm10")}

    def __getitem__(self, assembly):
        return self.pgs[assembly]

class PGsearch:
    def __init__(self, pg, assembly):
        self.pg = pg
        self.assembly = assembly

    def chromCounts(self):
        tableName = self.assembly + "_cre" + "_nums"
        q = """SELECT chrom, count from {tn}""".format(
            tn = tableName)
        with getcursor(self.pg.DBCONN, "pg") as curs:
            curs.execute(q)
            r = curs.fetchall()
        arr = [(e[0], e[1]) for e in r]
        return natsorted(arr, key=lambda y: y[0])

    def creHist(self):
        tableName = self.assembly + "_cre_bins"
        q = """SELECT chrom, buckets, numBins, binMax from {tn}""".format(
            tn = tableName)
        with getcursor(self.pg.DBCONN, "pg") as curs:
            curs.execute(q)
            r = curs.fetchall()
        return {e[0] : {"bins" : e[1],
                        "numBins" : e[2],
                        "binMax" : e[3]} for e in r}

    def creTable(self, chrom, start, stop, j):
        if chrom:
            tableName = '_'.join([self.assembly, "cre", chrom])
        else:
            tableName = '_'.join([self.assembly, "cre"])
        print(tableName)

        fields = ', '.join(["accession", "negLogP",
                            "chrom", "start", "stop",
                            "infoAll.approved_symbol AS gene_all" ,
                            "infoPc.approved_symbol AS gene_pc",
                            "0::int as in_cart"])

        print("""TODO need more variables here:
              accessions, gene_all_start, gene_all_end, 
              gene_pc_start, gene_pc_end,
              rank_dnase_start, rank_dnase_end,
              rank_promoter_start, rank_promoter_end,
              rank_enhancer_start, rank_enhancer_end,
              rank_ctcf_start, rank_ctcf_end""")
        
        with getcursor(self.pg.DBCONN, "_cre_table") as curs:
            curs.execute("""
SELECT JSON_AGG(r) from(
SELECT {fields}
FROM {tn} as cre
inner join {gtn} as infoAll
on cre.gene_all_id[1] = infoAll.geneid
inner join {gtn} as infoPc
on cre.gene_pc_id[1] = infoPc.geneid
WHERE int4range(start, stop) && int4range(%s, %s)
ORDER BY neglogp desc limit 100) r
""".format(fields = fields, tn = tableName,
           gtn = self.assembly + "_gene_info"), (start, stop))
            rows = curs.fetchall()[0][0]
            if not rows:
                rows = []

            # TODO: could be slow......
            curs.execute("""
SELECT count(0) FROM {tn}
WHERE int4range(start, stop) && int4range(%s, %s)""".format(tn = tableName),
                         (start, stop))
            total = curs.fetchone()[0]
        return {"cres": rows, "total" : total}

    def crePos(self, accession):
        with getcursor(self.pg.DBCONN, "cre_pos") as curs:
            curs.execute("""
SELECT chrom, start, stop FROM {tn} WHERE accession = %s
""".format(tn = self.assembly + "_cre"), (accession, ))
            r = curs.fetchone()
        if not r:
            print("ERROR: missing", accession)
            return None
        return Coord(r[0], r[1], r[2])

    def _getGenes(self, accession, chrom, curs, group):
        curs.execute("""
SELECT gi.approved_symbol, g.distance
FROM
(SELECT UNNEST(gene_{group}_id) geneid, UNNEST(gene_{group}_distance) distance
FROM {tn} WHERE accession = %s) AS g
INNER JOIN {gtn} AS gi
ON g.geneid = gi.geneid
""".format(tn = self.assembly + "_cre_" + chrom,
           gtn = self.assembly + "_gene_info",
           group = group), (accession, ))
        return curs.fetchall()

    def creGenes(self, accession, chrom):
        with getcursor(self.pg.DBCONN, "cre_genes") as curs:
            return (self._getGenes(accession, chrom, curs, "all"),
                    self._getGenes(accession, chrom, curs, "pc"))

    def intersectingSnps(self, coord, halfWindow):
        c = coord.expanded(halfWindow)
        tableName = self.assembly + "_snps_" + c.chrom
        with getcursor(self.pg.DBCONN, "intersectingSnps") as curs:
            curs.execute("""
SELECT start, stop, name FROM {tn} WHERE int4range(start, stop) &&
int4range(%s, %s)
""".format(tn = tableName), (c.start, c.end))
            snps = curs.fetchall()
        ret = []
        for snp in snps:
            start = snp[0]
            end = snp[1]
            ret.append({"name" : snp[2],
                        "distance" : min(abs(coord.end - end),
                                         abs(coord.start - start))})
        return ret

    def nearbyCREs(self, accession, coord, halfWindow):
        c = coord.expanded(halfWindow)
        tableName = self.assembly + "_cre_" + c.chrom
        with getcursor(self.pg.DBCONN, "nearbyCREs") as curs:
            curs.execute("""
SELECT start, stop, accession FROM {tn} WHERE int4range(start, stop) &&
int4range(%s, %s)
""".format(tn = tableName), (c.start, c.end))
            cres = curs.fetchall()
        ret = []
        for c in cres:
            acc = c[2]
            if acc == accession:
                continue
            start = c[0]
            end = c[1]
            ret.append({"name" : acc,
                        "distance" : min(abs(coord.end - end),
                                         abs(coord.start - start))})
        return ret

    def creTad(self, accession, chrom):
        with getcursor(self.pg.DBCONN, "creTad") as curs:
            curs.execute("""
SELECT gi.approved_symbol AS name
FROM
(SELECT UNNEST(tads) geneid
FROM {tn} WHERE accession = %s) AS g
INNER JOIN {gtn} AS gi
ON g.geneid = gi.geneid
""".format(tn = self.assembly + "_cre_" + chrom,
           gtn = self.assembly + "_gene_info"), (accession, ))
            rows = curs.fetchall()
        return [{"name" : r[0]} for r in rows]

