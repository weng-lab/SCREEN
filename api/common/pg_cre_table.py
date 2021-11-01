#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng



import psycopg2
import json
import itertools
from io import StringIO
import io
from operator import itemgetter

import sys
import os
from natsort import natsorted
from collections import namedtuple
import psycopg2.extras

from coord import Coord
from pg_common import PGcommon
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__), "../../utils"))
from utils import eprint


class PGcreTable(object):

    infoFields = {"accession": "cre.accession",
                  "isproximal": "cre.isproximal",
                  "k4me3max": "cre.h3k4me3_max",
                  "k27acmax": "cre.h3k27ac_max",
                  "ctcfmax": "cre.ctcf_max",
                  "concordant": "cre.concordant"}

    @staticmethod
    def _getInfo():
        pairs = []
        for k, v in PGcreTable.infoFields.items():
            pairs.append("'%s', %s" % (k, v))
        return "json_build_object(" + ','.join(pairs) + ") as info"

    def __init__(self, pw, assembly, ctmap, ctsTable):
        self.pw = pw
        self.assembly = assembly
        self.ctmap = ctmap
        self.ctsTable = ctsTable

        self.tableName = self.assembly + "_cre_all"

        self.ctSpecifc = {}
        self.fields = [
            "cre.maxZ",
            "cre.chrom", "cre.start",
            "cre.stop - cre.start AS len",
            "cre.gene_all_id", "cre.gene_pc_id",
            "0::int as in_cart",
            "cre.pct"]
        self.whereClauses = []

    def _getCtSpecific(self, useAccs):
        pairs = []
        if not useAccs:
            for k, v in self.ctSpecifc.items():
                pairs.append("'%s', %s" % (k, v))
        return "json_build_object(" + ','.join(pairs) + ") as ctSpecifc"

    def _sct(self, ct):
        if ct in self.ctsTable:
            self.fields.append("cre.creGroupsSpecific[%s] AS sct" %  # TODO rename to sct
                               self.ctsTable[ct])
        else:
            self.fields.append("0::int AS sct")

    def _buildWhereStatement(self, j, chrom, start, stop):
        useAccs = self._accessions(j)
        if useAccs and False:
            self._notCtSpecific(j)
        else:
            ct = j.get("cellType", None)

            self._sct(ct)
            if ct:
                self._ctSpecific(ct, j)
            else:
                self._notCtSpecific(j)

            self._where(chrom, start, stop)

        fields = ', '.join([PGcreTable._getInfo(), self._getCtSpecific(False)] + self.fields)
        ret = ""
        if len(self.whereClauses) > 0:
            ret = "WHERE " + " and ".join(self.whereClauses)
        return fields, ret

    def geneTable(self, j, chrom, start, stop):
        # print(self.assembly + '_gene_details')
        rows = self.pw.fetchall("select_gene_table", """
        SELECT  * from {tableName} 
        WHERE transcript_id IN (
        SELECT transcript_id from {tableName}
        WHERE feature='transcript' 
        AND seqname='{seqname}' 
        AND (int4range({startpos}, {endpos}) &&
        int4range(startpos, endpos)  ))
        """.format(tableName=self.assembly + '_gene_details',
                   seqname=chrom, startpos=start, endpos=stop))

        response = []
        transcript_id = ''
        transcript_id_value = ''
        for row in rows:
            response.append({
                'transcript_id': row[9],
                'seqid': row[1].rstrip(),
                'type': row[4],
                'start': row[2],
                'end': row[3],
                'strand': row[6].rstrip(),
                'exon_number': row[5],
                'parent': row[7],
            })
        result = []
        response = sorted(response, key=itemgetter('transcript_id'))
        for (key, value) in itertools.groupby(response,
                                              key=itemgetter('transcript_id')):
            v = []
            start = ''
            end = ''
            strand = ''
            for i in value:
                gtype = i.get('type')
                if gtype == 'transcript':
                    start = i.get('start')
                    end = i.get('end')
                    strand = i.get('strand')
                    seqid = i.get('seqid')
                if gtype == 'CDS' or gtype == 'exon':
                    v.append(i)
            if len(v) > 0:
                result.append({
                    'transcript_id': key,
                    'seqid': seqid,
                    'start': start,
                    'end': end,
                    'strand': strand,
                    'values': v,
                })
        return result
    
    def creTable(self, j, chrom, start, stop):

        """
        tfclause = "peakintersections.accession = cre.accession"
        if "tfs" in j:
            tfclause += " and peakintersections.tf ?| array(" + ",".join(["'%s'" % tf for tf in j["tfs"]]) + ")"
        """

        fields, whereClause = self._buildWhereStatement(j, chrom, start, stop)

        rows = self.pw.fetchall("cre_table", """
        SELECT JSON_AGG(r) from(
        SELECT {fields}, {vtn}.vistaids
        FROM {tn} AS cre
        INNER JOIN {ttn} ON {ttn}.accession = cre.accession
        LEFT JOIN {vtn} ON {vtn}.accession = cre.accession
        {whereClause}
        ORDER BY cre.maxZ DESC
        LIMIT 1000) r
        """.format(fields=fields, tn=self.tableName,
                   vtn = self.assembly + "_vista",
                   ttn = self.assembly + "_cre_all",
                   whereClause=whereClause))

        r = rows[0][0]
        if not r:
            r = []

        total = len(rows)
        if total >= 1000:  # reached query limit
            total = self._creTableEstimate(curs, whereClause)
        return {"cres": r, "total": total}

    def _accessions(self, j):
        accs = j.get("accessions", [])
        if not accs or 0 == len(accs):
            return False

        if accs and len(accs) > 0:
            if type(accs[0]) is dict:
                accs = [x["value"] for x in accs if x["checked"]]
            accs = [x for x in accs if isaccession(x)]
            if accs:
                accs = ["'%s'" % x.upper() for x in accs]
                accsQuery = "cre.accession IN (%s)" % ','.join(accs)
                self.whereClauses.append("(%s)" % accsQuery)
                return True
        return False

    def _where(self, chrom, start, stop):
        if chrom and start and stop:
            self.whereClauses += ["cre.chrom = '%s'" % chrom,
                                  "int4range(cre.start, cre.stop) && int4range(%s, %s)" % (int(start), int(stop))]

    def _creTableEstimate(self, curs, whereClause):
        # estimate count
        # from https://wiki.postgresql.org/wiki/Count_estimate

        # qoute escape from
        # http://stackoverflow.com/a/12320729
        r = self.pw.fetchone("_creTableEstimate", """
        SELECT count(0)
        FROM {tn} AS cre
        {wc}
        """.format(tn=self.tableName, wc=whereClause))
        return r[0]

    def _notCtSpecific(self, j):
        # use max zscores
        allmap = {"dnase": "dnase_max",
                  "promoter": "h3k4me3_max",
                  "enhancer": "h3k27ac_max",
                  "ctcf": "ctcf_max"}
        for x in ["dnase", "promoter", "enhancer", "ctcf"]:
            if "rank_%s_start" % x in j and "rank_%s_end" % x in j:
                _range = [j["rank_%s_start" % x],
                          j["rank_%s_end" % x]]
                self.whereClauses.append("(%s)" % " and ".join(
                    ["cre.%s >= %f" % (allmap[x], _range[0]),
                     "cre.%s <= %f" % (allmap[x], _range[1])]))
            self.fields.append("cre.%s AS %s_zscore" % (allmap[x], x))

    def _ctSpecific(self, ct, j):
        self.ctSpecifc["ct"] = "'" + ct + "'"
        for name, exp in [("dnase", "dnase"),
                          ("promoter", "h3k4me3"),
                          ("enhancer", "h3k27ac"),
                          ("ctcf", "ctcf")]:
            if ct not in self.ctmap[name]:
                self.fields.append("'' AS %s_zscore" % (name))
                self.ctSpecifc[name + "_zscore"] = "null"
                continue
            cti = self.ctmap[name][ct]
            self.fields.append("cre.%s_zscores[%d] AS %s_zscore" % (exp, cti, name))
            self.ctSpecifc[name + "_zscore"] = "cre.%s_zscores[%d]" % (exp, cti)

            if "rank_%s_start" % name in j and "rank_%s_end" % name in j:
                _range = [j["rank_%s_start" % name],
                          j["rank_%s_end" % name]]
                minDefault = -10.0  # must match slider default
                maxDefault = 10.0   # must match slider default
                if isclose(_range[0], minDefault) and isclose(_range[1], maxDefault):
                    continue  # not actually filtering on zscore, yet...
                if not isclose(_range[0], minDefault) and not isclose(_range[1], maxDefault):
                    self.whereClauses.append("(%s)" % " and ".join(
                        ["cre.%s_zscores[%d] >= %f" % (exp, cti, _range[0]),
                         "cre.%s_zscores[%d] <= %f" % (exp, cti, _range[1])]))
                elif not isclose(_range[0], minDefault):
                    self.whereClauses.append("(%s)" %
                                             "cre.%s_zscores[%d] >= %f" % (exp, cti, _range[0]))
                elif not isclose(_range[1], maxDefault):
                    self.whereClauses.append("(%s)" %
                                             "cre.%s_zscores[%d] <= %f" % (exp, cti, _range[1]))

    def creTableDownloadBed(self, j, fnp):
        chrom = checkChrom(self.assembly, j)
        start = j.get("coord_start", 0)
        stop = j.get("coord_end", 0)

        fields, whereClause = self._buildWhereStatement(j, chrom, start, stop)
        fields = ', '.join(["cre.chrom", "cre.start",
                            "cre.stop",
                            "cre.accession", "dnase_max"])

        q = """
COPY (
SELECT {fields}
FROM {tn} AS cre
INNER JOIN {ttn} ON {ttn}.accession = cre.accession
{whereClause}
) to STDOUT
with DELIMITER E'\t'
""".format(fields=fields,
           tn=self.tableName,
           ttn = self.assembly + "_cre_all",
           whereClause=whereClause)

        self.pw.copy_expert("_cre_table_bed", q, fnp)

    def creTableDownloadJson(self, j, fnp, cache):
        chrom = checkChrom(self.assembly, j)
        start = j.get("coord_start", None)
        stop = j.get("coord_end", None)

        fields, whereClause = self._buildWhereStatement(j, chrom, start, stop)

        q = """
copy (
SELECT JSON_AGG(r) from (
SELECT *
FROM {tn} AS cre
INNER JOIN {ttn} ON {ttn}.accession = cre.accession
{whereClause}
) r
) to STDOUT
with DELIMITER E'\t'
""".format(tn=self.tableName, ttn = self.assembly + "_cre_all",
           whereClause=whereClause)
        
        sf = io.StringIO()
        self.pw.copy_expert_file_handle("_cre_table_json", q, sf)
        sf.seek(0)
        def dupdate(j, x):
            j.update(x)
            return j
        with open(fnp, 'w') as f:
            lines = json.loads(sf.read().replace("\\n", ""))
            f.write(json.dumps([
                dupdate(j, {
                    "all_nearby_gene_ids": [ cache.genePGIDsToApprovedSymbol[x] for x in j["gene_all_id"] if x in cache.genePGIDsToApprovedSymbol ],
                    "pc_nearby_gene_ids": [ cache.genePGIDsToApprovedSymbol[x] for x in j["gene_pc_id"] if x in cache.genePGIDsToApprovedSymbol ]
                }) for j in lines
            ]) + '\n')
