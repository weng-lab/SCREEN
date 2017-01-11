import sys
import os
import gzip
import json
import constants
#!/usr/bin/env python

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from dbs import DBS
from db_utils import getcursor

from dbconnect import db_connect
from constants import chroms

class PostgresWrapper:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN
        self.assays = ["dnase", "tf", "histone"]
        self.assemblies = ["hg19", "mm10"]
        self.chroms = {}
        self.chroms = constants.chroms

    def get_helpkey(self, key):
        with getcursor(self.DBCONN, "get_helpkey") as curs:
            curs.execute("""SELECT title, summary, link FROM helpkeys
                                                        WHERE key = %(key)s""",
                         {"key": key})
            r = curs.fetchall()
        return r[0] if r else None

    def findBedOverlapAllAssays(self, assembly, chrom, start, end,
                                overlap_fraction = 0.0, overlap_bp = 0):
        retval = self.findBedOverlap("dnase", assembly, chrom, start, end, overlap_fraction = overlap_fraction, overlap_bp = overlap_bp)
        retval += self.findBedOverlap("tf", assembly, chrom, start, end, overlap_fraction = overlap_fraction, overlap_bp = overlap_bp)
        retval += self.findBedOverlap("histone", assembly, chrom, start, end, overlap_fraction = overlap_fraction, overlap_bp = overlap_bp)
        return retval

    def findBedOverlap(self, assay, assembly, chrom, start, end,
                       overlap_fraction = 0.0, overlap_bp = 0):
        if overlap_fraction > 1.0: overlap_fraction = 1.0

        tableName = "bed_ranges_" + self.get_table_suffix(assay, assembly, chrom)
        if tableName == "bed_ranges_": return []
        retval = []

        with getcursor(self.DBCONN, "findBedOverlap") as curs:
            if overlap_fraction <= 0.0 and overlap_bp <= 0:
                curs.execute("""
                SELECT DISTINCT file_accession, startend * int4range(%(start)s, %(end)s) AS overlap
                FROM {tableName}
                WHERE startend && int4range(%(start)s, %(end)s)
                """.format(tableName = tableName), {"start": start, "end": end})
            elif overlap_fraction > 0.0:
                curs.execute("""
                SELECT DISTINCT file_accession, startend * int4range(%(start)s, %(end)s) AS overlap
                FROM {tableName}
                WHERE upper(startend * int4range(%(start)s, %(end)s)) - lower(startend * int4range(%(start)s, %(end)s)) / %(length)s >= %(ofrac)s
                """.format(tableName = tableName), {"length": end - start, "ofrac": overlap_fraction})
            else:
                curs.execute("""
                SELECT DISTINCT file_accession, startend * int4range(%(start)s, %(end)s) AS overlap
                FROM {tableName}
                WHERE upper(startend * int4range(%(start)s, %(end)s)) - lower(startend * int4range(%(start)s, %(end)s)) >= %(obp)s
                """.format(tableName = tableName), {"obp": overlap_bp})
            for x in curs.fetchall():
                r = 0 if x[1].isempty else x[1].upper - x[1].lower
                retval.append((x[0], r, r / (end - start)))
            return retval

    def logQuery(self, query, ret, ip):
        userQuery = query.get("userQuery", "")
        esIndex = query.get("index", "")

        numResults = -1
        if "results" in ret:
            if "results" in ret["results"]:
                numResults = ret["results"]["results"]["total"]

        with getcursor(self.DBCONN, "logQuery") as curs:
            curs.execute("""
            INSERT into query_logs(query, userQuery, esIndex, numResults, ip)
            VALUES (%(query)s, %(userQuery)s,
            %(esIndex)s, %(numResults)s, %(ip)s)""",
                         {"query" : json.dumps(query),
                          "userQuery" : userQuery,
                          "esIndex" : esIndex,
                          "numResults": numResults,
                          "ip" : ip})

    def getCart(self, guid):
        with getcursor(self.DBCONN, "getCart") as curs:
            curs.execute("""
            SELECT re_accessions
            FROM cart
            WHERE uid = %(uid)s
            """, {"uid": guid})
            r = curs.fetchall()
        if r:
            return r[0][0]
        return None

    def addToCart(self, uuid, reAccessions):
        with getcursor(self.DBCONN, "addToCart") as curs:
            curs.execute("""
            SELECT re_accessions
            FROM cart
            WHERE uid = %(uuid)s""",{"uuid": uuid})
            if (curs.rowcount > 0):
                curs.execute("""
                UPDATE cart
                SET (re_accessions) = (%(re_accessions)s)
                WHERE uid = %(uuid)s""",
                             {"uuid": uuid,
                              "re_accessions" : json.dumps(reAccessions)})
            else:
                curs.execute("""
                INSERT into cart(uid, re_accessions)
                VALUES (%(uuid)s, %(re_accessions)s)""",
                            {"uuid": uuid,
                             "re_accessions" : json.dumps(reAccessions)})
            return {"rows" : curs.rowcount}

    def select_correlations(self, ct1, ct2, field, _chr, res, assembly):
        with getcursor(self.DBCONN, "DB::select_correlation") as curs:
            curs.execute("""SELECT correlation FROM {table}
                                               WHERE ct1 = (SELECT id FROM celltypesandtissues WHERE celltype = %(ct1)s)
                                                 AND ct2 = (SELECT id FROM celltypesandtissues WHERE celltype = %(ct2)s)
                                                 AND resolution = %(res)s AND chr = %(_chr)s""".format(table = "%s_%s" % (assembly, field)),
                         {"ct1": ct1, "ct2": ct2, "_chr": _chr, "res": res})
            r = curs.fetchall()
        return [float(x) for x in r[0][0]] if r else None

    def select_totals(self, _chr, res, assembly):
        with getcursor(self.DBCONN, "DB::select_totals") as curs:
            curs.execute("""SELECT bintotals FROM {table}
                                             WHERE resolution = %(res)s AND chr = %(_chr)s""".format(table = "%s_totals" % assembly),
                         {"res": res, "_chr": _chr})
            r = curs.fetchall()
        return r[0][0] if r else None

def main():
    DBCONN = db_connect(os.path.realpath(__file__))
    ps = PostgresWrapper(DBCONN)

    import json
    uid = "test"
    j = {"a" : [1,2,3]}
    ps.addToCart(uid, json.dumps(j))
    print(ps.getCart(uid))

    j = {"b" : [5,6,7]}
    ps.addToCart(uid, json.dumps(j))
    print(ps.getCart(uid))

    print(ps.getCart("nocart"))

if __name__ == '__main__':
    sys.exit(main())
