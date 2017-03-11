#!/usr/bin/env python

from __future__ import print_function

import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip
import psycopg2.extras

from coord import Coord
from pg_common import PGcommon
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor, timedQuery
from utils import eprint

class PGcreTable:
    def __init__(self, pg, assembly, ctmap):
        self.pg = pg
        self.assembly = assembly
        self.ctmap = ctmap

    def _creTableCart(self, j, chrom, start, stop):
        accs = j.get("accessions", [])

        if not accs or 0 == len(accs):
            return None, None

        fields = []
        whereclauses = []

        if accs and len(accs) > 0:
            if type(accs[0]) is dict:
                accs = [x["value"] for x in accs if x["checked"]]
            accs = filter(lambda x: isaccession(x), accs)
            if accs:
                accs = ["'%s'" % x.upper() for x in accs]
                accsQuery = "accession IN (%s)" % ','.join(accs)
                whereclauses.append("(%s)" % accsQuery)

        allmap = {"dnase": "dnase_max",
                  "promoter": "h3k4me3_max",
                  "enhancer": "h3k27ac_max",
                  "ctcf": "ctcf_max" }
        for x in ["dnase", "promoter", "enhancer", "ctcf"]:
            if "rank_%s_start" % x in j and "rank_%s_end" in j:
                _range = [j["rank_%s_start" % x] / 100.0,
                          j["rank_%s_end" % x] / 100.0]
                whereclauses.append("(%s)" % " and ".join(
                    ["cre.%s >= %f" % (allmap[x], _range[0]),
                     "cre.%s <= %f" % (allmap[x], _range[1]) ] ))
            fields.append("cre.%s AS %s_zscore" % (allmap[x], x))

        whereclause = ""
        if len(whereclauses) > 0:
            whereclause = "WHERE " + " and ".join(whereclauses)
        #print(whereclause)
        return (fields, whereclause)

    def _creTableWhereClause(self, j, chrom, start, stop):
        whereclauses = []

        if 0:
            print(j, """TODO need more variables here:
        gene_all_start, gene_all_end,
        gene_pc_start, gene_pc_end""")

        """
        tfclause = "peakintersections.accession = cre.accession"
        if "tfs" in j:
            tfclause += " and peakintersections.tf ?| array(" + ",".join(["'%s'" % tf for tf in j["tfs"]]) + ")"
        """

        ct = j.get("cellType", None)
        fields = []
        whereclauses = []

        if chrom and start and stop:
            whereclauses += ["cre.chrom = '%s'" % chrom,
                             "int4range(cre.start, cre.stop) && int4range(%s, %s)" % (int(start), int(stop))]

        if ct:
            for assay in [("dnase", "dnase"),
                          ("promoter", "h3k4me3"),
                          ("enhancer", "h3k27ac"),
                          ("ctcf", "ctcf")]:
                if ct not in self.ctmap[assay[0]]:
                    fields.append("'' AS %s_zscore" % (assay[0]))
                    continue
                cti = self.ctmap[assay[0]][ct]
                fields.append("cre.%s_zscores[%d] AS %s_zscore" % (assay[1], cti, assay[0]))

                if "rank_%s_start" % assay[0] in j and "rank_%s_end" % assay[0] in j:
                    _range = [j["rank_%s_start" % assay[0]] / 100.0,
                              j["rank_%s_end" % assay[0]] / 100.0]
                    minDefault = -10.0  # must match slider default
                    maxDefault = 10.0   # must match slider default
                    if isclose(_range[0], minDefault) and isclose(_range[1], maxDefault):
                        continue # not actually filtering on zscore, yet...
                    if not isclose(_range[0], minDefault):
                        whereclauses.append("(%s)" %
                                            "cre.%s_zscores[%d] >= %f" % (assay[1], cti, _range[0]))
                    elif not isclose(_range[1], maxDefault):
                        whereclauses.append("(%s)" %
                                            "cre.%s_zscores[%d] <= %f" % (assay[1], cti, _range[1]))
                    else:
                        whereclauses.append("(%s)" % " and ".join(
                                ["cre.%s_zscores[%d] >= %f" % (assay[1], cti, _range[0]),
                                 "cre.%s_zscores[%d] <= %f" % (assay[1], cti, _range[1])] ))
        else:
            allmap = {"dnase": "dnase_max",
                      "promoter": "h3k4me3_max",
                      "enhancer": "h3k27ac_max",
                      "ctcf": "ctcf_max" }
            for x in ["dnase", "promoter", "enhancer", "ctcf"]:
                if "rank_%s_start" % x in j and "rank_%s_end" in j:
                    _range = [j["rank_%s_start" % x] / 100.0,
                              j["rank_%s_end" % x] / 100.0]
                    whereclauses.append("(%s)" % " and ".join(
                        ["cre.%s >= %f" % (allmap[x], _range[0]),
                         "cre.%s <= %f" % (allmap[x], _range[1]) ] ))
                fields.append("cre.%s AS %s_zscore" % (allmap[x], x))

        whereclause = ""
        if len(whereclauses) > 0:
            whereclause = "WHERE " + " and ".join(whereclauses)
        #print(whereclause)
        return (fields, whereclause)

    def _rfacets_active(self, j):
        present = []
        ct = j.get("cellType", None)
        if ct:
            for assay in ["dnase", "promoter", "enhancer", "ctcf"]:
                if ct in self.ctmap[assay]:
                    present.append(assay)
        return present

    def creTable(self, j, chrom, start, stop):
        tableName = self.assembly + "_cre_all"

        fields, whereclause = self._creTableCart(j, chrom, start, stop)
        if not fields:
            fields, whereclause = self._creTableWhereClause(j, chrom, start, stop)

        fields = ', '.join(fields + [
            "accession", "maxZ",
            "cre.chrom", "cre.start",
            "cre.stop - cre.start AS len",
            "cre.gene_all_id", "cre.gene_pc_id",
            "0::int as in_cart",
            "cre.creGroup"])

        with getcursor(self.pg.DBCONN, "_cre_table") as curs:
            q = """
SELECT JSON_AGG(r) from(
SELECT {fields}
FROM {tn} AS cre
{whereclause}
ORDER BY maxz DESC
LIMIT 1000) r
""".format(fields = fields, tn = tableName,
           whereclause = whereclause)

            #print("\n", q, "\n")
            if 0:
                timedQuery(curs, q)
            else:
                curs.execute(q)
            rows = curs.fetchall()[0][0]
            if not rows:
                rows = []

            total = len(rows)
            if total >= 1000: # reached query limit
                total = self._creTableEstimate(curs, tableName, whereclause)
        return {"cres": rows, "total" : total}

    def _creTableEstimate(self, curs, tableName, whereclause):
        # estimate count
        # from https://wiki.postgresql.org/wiki/Count_estimate

        # qoute escape from
        # http://stackoverflow.com/a/12320729
        q = """
SELECT count(0)
FROM {tn} AS cre
{wc}
""".format(tn = tableName, wc = whereclause)
        if 0:
            timedQuery(curs, q)
        else:
            curs.execute(q)
        return curs.fetchone()[0]

