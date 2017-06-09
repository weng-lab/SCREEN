from __future__ import print_function

import sys, os
import math

class PGFantomCat:

    GENECOLUMNS = [
        ("id", "serial PRIMARY KEY"),
        ("chrom", "TEXT"), ("start", "INT"), ("stop", "INT"),
        ("geneid", "TEXT"), ("genename", "TEXT"), ("aliases", "TEXT"),
        ("geneclass", "TEXT"),
        ("dhssupport", "TEXT"), ("genecategory", "TEXT"),
        ("TIRconservation", "DECIMAL"),
        ("exonconservation", "FLOAT"), ("traitdfr", "FLOAT"),
        ("eqtlcoexpr", "FLOAT"), ("dynamicexpr", "FLOAT")
    ]
    GENEFIELDS = [x for x, _ in GENECOLUMNS]

    def __init__(self, assembly, tableprefix = "fantomcat"):
        self._tables = {
            "genes": "_".join((assembly, tableprefix, "genes")),
            "intersections": "_".join((assembly, tableprefix, "intersection")),
            "twokb_intersections": "_".join((assembly, tableprefix, "twokbintersection"))
        }

    def drop_and_recreate(self, curs):
        curs.execute("""
DROP TABLE IF EXISTS {genes};
CREATE TABLE {genes} ({fields})"""
                     .format(genes = self._tables["genes"], fields = ",".join(" ".join(x) for x in PGFantomCat.GENECOLUMNS)))
        curs.execute("""
DROP TABLE IF EXISTS {intersections};
CREATE TABLE {intersections} (id serial PRIMARY KEY, geneid TEXT, cre TEXT)"""
                      .format(intersections = self._tables["intersections"]))
        curs.execute("""
DROP TABLE IF EXISTS {intersections};
CREATE TABLE {intersections} (id serial PRIMARY KEY, geneid TEXT, cre TEXT)"""
                      .format(intersections = self._tables["twokb_intersections"]))

    def import_genes_fromfile(self, fnp, curs):
        with open(fnp, "r") as f:
            curs.copy_from(f, self._tables["genes"], columns = [x for x in PGFantomCat.GENEFIELDS[1:]])

    def import_intersections_fromfile(self, fnp, curs, key = "intersections"):
        with open(fnp, "r") as f:
            curs.copy_from(f, self._tables[key], columns = ["geneid", "cre"])
    
    def select_gene(self, field, value, curs):
        if field not in [x for x in PGFantomCat.GENEFIELDS]:
            print("WARNING: attempted to select '%s' from nonexistent column '%s' in FantomCat table"
                  % (value, field))
            return None
        curs.execute("SELECT * FROM {genes} WHERE {field} = %s".format(genes = self._tables["genes"], field = field),
                     value)
        return curs.fetchall()

    def select_cre_intersections(self, acc, curs):
        curs.execute("""
SELECT {fields} FROM {genes} AS g, {intersections} as i
WHERE i.geneid = g.geneid AND i.cre = %(acc)s
""".format(intersections = self._tables["intersections"], genes = self._tables["genes"],
           fields = ",".join([("g." + x) for x in PGFantomCat.GENEFIELDS[1:]])), {"acc": acc})
        return [{PGFantomCat.GENEFIELDS[i + 1]: v[i] if i < 9 or not math.isnan(v[i]) else "--"
                 for i in xrange(len(v)) } for v in curs.fetchall()]

    def select_rna_intersections(self, gid, curs):
        curs.execute("SELECT cre FROM {intersections} WHERE geneid = %s".format(intersections = self._tables["intersections"]),
                     gid)
        return [x[0] for x in curs.fetchall()]
