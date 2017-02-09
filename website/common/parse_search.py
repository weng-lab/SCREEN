#!/usr/bin/env python

import sys, os
import re
from coord import Coord

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession

sys.path.append(os.path.join(os.path.dirname(__file__),
                             "../../../metadata/utils"))
from db_utils import getcursor

def _unpack_tuple_array(a):
    return ([i[0] for i in a], [i[1] for i in a])

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

    def _try_find_gene(self, s):
        p = s.lower().split()
        interpretation = None
        with getcursor(self.DBCONN, "parse_search$ParseSearch::parse") as curs:
            for h in xrange(len(p)):
                x = len(p) / (h + 1)
                for q in [" ".join(p[x * i : x * (i + 1)]) for i in xrange(h + 1)]:
                    print("!", q)
                    curs.execute("SELECT name, chrom, start, stop, similarity(name, '{q}') AS sm FROM {assembly}_autocomplete WHERE name % '{q}' ORDER BY sm DESC LIMIT 1".format(assembly=self.assembly, q=s))
                    r = curs.fetchall()
                    if r:
                        if r[0][0].lower() not in s.lower():
                            interpretation = r[0][0]
                        return (interpretation, Coord(r[0][1], r[0][2], r[0][3]))
        return (interpretation, None)

    def _try_find_celltype(self, s):
        pass

    def _find_coord(self, s):
        _p = s.split()
        for x in _p:
            r = re.search("^chr[0-9XYM][0-9]?[\s]*[\:]?[\s]*[0-9,\.]+[\s\-]+[0-9,\.]+", x)
            if r:
                p = r.group(0).replace("-", " ").replace(":", " ").replace(",", "").replace(".", "").split()
                return Coord(p[0], p[1], p[2])
        if not r: return None
        p = r.group(0).replace("-", " ").replace(":", " ").split()
        return Coord(p[0], p[1], p[2])

    def has_overlap(self, coord):
        if not coord: return False
        with getcursor(self.DBCONN, "parse_search$ParseSearch::parse") as curs:
            curs.execute("SELECT accession FROM {tn} WHERE maxZ >= 1.64 AND chrom = '{chrom}' AND {start} > start AND {end} < stop".format(tn = self.assembly + "_cre_" + coord.chrom,
                                                                                                                                           chrom = coord.chrom, start = coord.start,
                                                                                                                                           end = coord.end))
            if curs.fetchone(): return True
        return False
    
    def parse(self, comparison = False):
        s = self._sanitize()
        self.sanitizedStr = s
        toks = s.split()
        toks = [t.lower() for t in toks]

        coord = self._find_coord(s)
        cellType = None
        interpretation = None
        accessions = []

        try:
            for t in toks:
                print(t)
                if isaccession(t):
                    accessions.append(t)
                    continue
                elif t.startswith("rs"):
                    coord = self._get_snpcoord(t)
                    if coord and not self.has_overlap(coord):
                        interpretation = "NOTICE: %s does not overlap any cREs; displaying any cREs within 2kb" % t
                        coord = Coord(coord.chrom, coord.start - 2000, coord.end + 2000)
        except:
            raise
            print("could not parse " + s)

        if coord is None:
            interpretation, coord = self._try_find_gene(s)
            interpretation = "Showing results for \"%s\"" % interpretation

        with getcursor(self.DBCONN, "parse_search$ParseSearch::parse") as curs:
            curs.execute("SELECT cellType, similarity(cellType, '{q}') AS sm FROM {assembly}_rankCellTypeIndexex WHERE cellType % '{q}' ORDER BY sm DESC LIMIT 1".format(assembly=self.assembly, q=s))
            r = curs.fetchall()
        if r:
            if r[0][0].lower() not in s.lower():
                interpretation = "Showing results for \"%s\"" % (r[0][0] if not interpretation else interpretation + " " + r[0][0])
            cellType = r[0][0]
            
        ret = {"cellType": cellType,
               "coord_chrom" : None,
               "coord_start" : None,
               "coord_end" : None,
               "element_type": None,
               "interpretation": interpretation}
            
        if "promoter" in toks:
            ret["element_type"] = "promoter-like"
            ret["rank_promoter_start"] = 164
            ret["rank_dnase_start"] = 164
            ret["gene_all_end"] = 5000
        elif "enhancer" in toks:
            ret["element_type"] = "enhancer-like"
            ret["rank_enhancer_start"] = 164
            ret["rank_dnase_start"] = 164
        elif "insulator" in toks:
            ret["element_type"] = "insulator-like"
            ret["rank_ctcf_start"] = 164            

        ct = None

        print(coord, ret["cellType"])
        if coord:
            ret["coord_chrom"] = coord.chrom
            ret["coord_start"] = coord.start
            ret["coord_end"] = coord.end
        ret["accessions"] = accessions
        return ret
