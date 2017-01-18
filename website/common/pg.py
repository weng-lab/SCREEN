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

    def creTable(self, chrom, start, stop):
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

