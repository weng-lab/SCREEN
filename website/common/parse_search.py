#!/usr/bin/env python

import sys, os
import re
from coord import Coord

sys.path.append(os.path.join(os.path.dirname(__file__),
                             "../../../metadata/utils"))
from db_utils import getcursor

def _unpack_tuple_array(a):
    return ([i[0] for i in a], [i[1] for i in a])

def isaccession(s):
    s = s.lower()
    return (s.startswith("eh37e") or s.startswith("em10e") and len(s) == 12)

class ParseSearch:
    def __init__(self, rawInput, DBCONN, assembly):
        self.DBCONN = DBCONN
        self.rawInput = rawInput

        self.halfWindow = 7500
        self.userErrMsg = ""

        self.assembly = assembly
        self.chroms = ["chr" + x for x in ([str(x) for x in range(1, 22 if assembly == "hg19" else 19)] + ["X", "Y"])]
        self._gene_tablename = self.assembly + "_gene_info"

    def _snp_tablename(self, c):
        return self.assembly + "_snps_" + c

    def _sanitize(self):
        # TODO: add more here!
        return self.rawInput[:2048]

    def parseStr(self):
        return self.sanitizedStr

    def find_celltypes_in_query(self, q):
        return [] #self.cell_type_query(q)

    def find_gene_in_q(self, q):
        p = q.split(" ")
        for i in xrange(len(p)):
            r = self._gene_alias_to_coordinates(p[i])
            if r:
                return r
        return None

    def _get_snpcoord(self, s):
        for chrom in self.chroms:
            with getcursor(self.DBCONN, "parse_search$ParseSearch::_get_snpcoord") as curs:
                curs.execute("""SELECT start, stop FROM {tablename}
                                WHERE name = '{s}'""".format(tablename=self._snp_tablename(chrom), s=s))
            r = curs.fetchone()
            if r: return Coord(chrom, r[0], r[1])
        return None
    
    def _gene_alias_to_coordinates(self, s):
        fields = ["approved_symbol", "ensemblid", "info->>'approved_name'", "info->>'UniProt_ID'", "info->>'UCSC_ID'", "info->>'Vega_ID'", "info->>'RefSeq_ID'"]
        whereclause = " or ".join(["LOWER(%s) = LOWER('%s')" % (x, s) for x in fields]) + " or (LOWER('%s') = ANY(translate(info->>'synonyms', '[]', '{}')::text[]))" % s
        print(whereclause)
        with getcursor(self.DBCONN, "parse_search$ParseSearch::gene_aliases_to_coordinates") as curs:
            curs.execute("""SELECT chrom, start, stop, info FROM {tablename}
                            WHERE {whereclause}""".format(tablename=self._gene_tablename, whereclause=whereclause))
            r = curs.fetchone()
        if not r or not r[0]:
            return None
        return Coord(r[0], r[1], r[2])

    def _find_coord(self, s):
        print(s)
        r = re.search("^chr[0-9XYM][0-9]?[\s]*[\:]?[\s]*[0-9]+[\s\-]+[0-9]+", s)
        print(r)
        if not r: return None
        p = r.group(0).replace("-", " ").replace(":", " ").split()
        return Coord(p[0], p[1], p[2])
    
    def parse(self, comparison = False):
        s = self._sanitize()
        self.sanitizedStr = s
        toks = s.split()
        toks = [t.lower() for t in toks]

        coord = self._find_coord(s)
        cellTypes = self.find_celltypes_in_query(s)
        interpretation = None
        
#        gene_suggestions, gene_results = self.gene_aliases_to_coordinates(s)
#        gene_toks, gene_coords = _unpack_tuple_array(gene_results)
#        snp_suggestions, snp_results = self.ac.snp_aliases_to_coordinates(s)
#        snp_toks, snp_coords = _unpack_tuple_array(snp_results)
        accessions = []

        try:
            for t in toks:
                print(t)
                if isaccession(t):
                    accessions.append(t)
                    continue
                elif t.startswith("rs"):
                    coord = self._get_snpcoord(t)
        except:
            raise
            print("could not parse " + s)

        if coord is None:
            with getcursor(self.DBCONN, "parse_search$ParseSearch::parse") as curs:
                curs.execute("SELECT name, chrom, start, stop, similarity(name, '{q}') AS sm FROM {assembly}_autocomplete WHERE name % '{q}' ORDER BY sm DESC LIMIT 1".format(assembly=self.assembly, q=s))
                r = curs.fetchall()
            if r:
                if r[0][0].lower() not in s.lower():
                    interpretation = r[0][0]
                coord = Coord(r[0][1], r[0][2], r[0][3])
            
        ret = {"cellType": None,
               "coord_chrom" : None,
               "coord_start" : None,
               "coord_end" : None,
               "range_preset": None,
               "interpretation": interpretation}
            
        if "promoter" in toks:
            ret["range_preset"] = "promoter"
        elif "enhancer" in toks:
            ret["range_preset"] = "enhancer"
        elif "insulator" in toks:
            ret["range_preset"] = "insulator"

        ct = None
        if len(cellTypes) > 0:
            ct = cellTypes[0].replace(" ", "_")

        print(coord, ret["cellType"])
        if coord:
            ret["coord_chrom"] = coord.chrom
            ret["coord_start"] = coord.start
            ret["coord_end"] = coord.end
        ret["accessions"] = accessions
        return ret
