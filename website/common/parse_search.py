#!/usr/bin/env python

import sys, os
import re
from coord import Coord

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession
from constants import chrom_lengths, chroms

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
        self.chroms = chroms[assembly]
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

    def _gene_alias_to_symbol(self, s):
        fields = ["approved_symbol", "ensemblid", "ensemblid_ver", "info->>'approved_name'", "info->>'UniProt_ID'", "info->>'UCSC_ID'", "info->>'Vega_ID'", "info->>'RefSeq_ID'"]
        whereclause = " or ".join(["LOWER(%s) = LOWER('%s')" % (x, s) for x in fields]) + " or (LOWER('%s') = ANY(translate(info->>'synonyms', '[]', '{}')::text[]))" % s
        print(whereclause)
        with getcursor(self.DBCONN, "parse_search$ParseSearch::gene_aliases_to_coordinates") as curs:
            curs.execute("""SELECT approved_symbol, info FROM {tablename}
                            WHERE {whereclause}""".format(tablename=self._gene_tablename, whereclause=whereclause))
            r = curs.fetchone()
        if not r or not r[0]:
            return None
        return r[0]

    def _try_find_gene(self, s, tss = False, tssdist = 0):
        if type(tssdist) is not int:
            tssdist = int(tssdist.replace("kb", "")) * 1000
        p = s.lower().split()
        interpretation = None
        with getcursor(self.DBCONN, "parse_search$ParseSearch::parse") as curs:
            for i in xrange(len(p)):
                s = " ".join(p[:len(p) - i])
                curs.execute("""
SELECT oname, chrom, start, stop, altchrom, altstart, altstop, 
similarity(name, %s) AS sm 
FROM {assembly}_autocomplete 
WHERE name %% %s 
ORDER BY sm DESC LIMIT 1
                """.format(assembly = self.assembly), (s, s))
                r = curs.fetchall()
                if r:
                    interpretation = r[0][0]
                    r = r[0]
                    if tss:
                        coord = Coord(r[4], int(r[5]) - tssdist, r[6])
                    else:
                        coord = Coord(r[1], int(r[2]) - tssdist, r[3])
                    same = r[1] == r[4] and r[2] == r[5] and r[3] == r[6]
                    return (interpretation,  coord, s, same)
        return (interpretation, None, " ".join(p), False)

    def get_genetext(self, gene, tss = False, notss = False, dist=0):
        def orjoin(a):
            return ", ".join(a[:-1]) + " or " + a[-1]
        gene = "<em>%s</em>" % gene
        if notss:
            return "This search is showing cREs overlapping the gene body of {q}.".format(q=gene)
        if tss:
            if not dist:
                return """
This search is showing candidate promoters located between the first and last TSS's of {q}.<br>
To see cREs overlapping the gene body of {q}, <a href='/search?q={q}&assembly={assembly}'>click here</a>.""".format(q=gene, assembly=self.assembly)
            return """
This search is showing candidate promoters located between the first and last TSS's of {q} and up to {d} upstream.<br>
To see cREs overlapping the gene body of {q}, <a href='/search?q={q}&assembly={assembly}'>click here</a>.""".format(q=gene, assembly=self.assembly, d=dist)
        dists = orjoin(["<a href='/search?q={q}+tssdist_{d}+promoter&assembly={assembly}'>{d}</a>".format(q=gene, assembly=self.assembly, d=d) for d in ["1kb", "2kb", "5kb", "10kb", "25kb", "50kb"]])
        return """
This search is showing cREs overlapping the gene body of {q}.<br>
To see candidate promoters located between the first and last TSS's of {q}, <a href='/search?q={q}+tss+promoter&assembly={assembly}'>click here</a>, <br />or click one of the following links to see candidate promoters within {dists} upstream of the TSSs.""".format(q=gene, assembly=self.assembly, dists=dists)

    def _try_find_celltype(self, s):
        pass

    def _find_coord(self, s):
        _p = s.split()
        for x in _p:
            # TODO: precompile re
            r = re.search("^[cC][hH][rR][0-9XYxy][0-9]?[\s]*[\:]?[\s]*[0-9,\.]+[\s\-]+[0-9,\.]+", x)
            if r:
                p = r.group(0).replace("-", " ").replace(":", " ").replace(",", "").replace(".", "").split()
                return (s.replace(r.group(0), "").strip(), Coord(p[0].replace("x", "X").replace("y", "Y"), p[1], p[2]))
        for x in _p:
            r = re.search("^[cC][hH][rR][0-9XYxy][0-9]?[\s]*[\:]?[\s]*[0-9,\.]+", x)
            if r:
                p = r.group(0).replace("-", " ").replace(":", " ").replace(",", "").replace(".", "").split()
                return (s.replace(r.group(0), "").strip(), Coord(p[0].replace("x", "X").replace("y", "Y"), p[1], int(p[1]) + 1))
        for x in _p:
            r = re.search("^[cC][hH][rR][0-9XxYy][0-9]?", x)
            if r:
                c = r.group(0).replace("x", "X").replace("y", "Y")
                return (s.replace(r.group(0), "").strip(), Coord(c, 0, chrom_lengths[self.assembly][c]))
        return (s, None)

    def has_overlap(self, coord):
        if not coord: return False
        with getcursor(self.DBCONN, "parse_search$ParseSearch::parse") as curs:
            # TODO: use int4range, and sanitize input
            curs.execute("""
SELECT accession 
FROM {tn} 
WHERE maxZ >= 1.64 AND chrom = '{chrom}' AND {start} > start AND {end} < stop
""".format(tn = self.assembly + "_cre_" + coord.chrom,
           chrom = coord.chrom, start = coord.start,
           end = coord.end))
            if curs.fetchone(): return True
        return False

    def _find_celltype(self, q, rev = False):
        p = q.split()
        interpretation = None
        for i in xrange(len(p)):
            s = " ".join(p[:len(p) - i]) if not rev else " ".join(p[i:])
            with getcursor(self.DBCONN, "parse_search$ParseSearch::parse") as curs:
                curs.execute("SELECT cellType, similarity(LOWER(cellType), '{q}') AS sm FROM {assembly}_rankCellTypeIndexex WHERE LOWER(cellType) % '{q}' ORDER BY sm DESC LIMIT 1".format(assembly=self.assembly, q=s))
                r = curs.fetchall()
                if not r:
                    curs.execute("SELECT cellType FROM {assembly}_rankCellTypeIndexex WHERE LOWER(cellType) LIKE '{q}%' LIMIT 1".format(assembly=self.assembly, q=s))
                    r = curs.fetchall()
            if r:
                if r[0][0].lower().strip() not in s.lower().strip() or s.lower().strip() not in r[0][0].lower().strip():
                    k = r[0][0].replace("_", " ")
                    interpretation = "Showing results for \"%s\"" % (k if not interpretation else interpretation + " " + k)
                return (" ".join(p[len(p) - i:]) if not rev else " ".join(p[i:]), r[0][0], interpretation)
        return (q, None, None)

    def parse(self, kwargs = None):
        s = self._sanitize().lower()
        self.sanitizedStr = s

        s, coord = self._find_coord(s)
        toks = s.split()
        toks = [t.lower() for t in toks]
        usetss = "tss" in toks or (kwargs and "tss" in kwargs)
        tssdist = 0
        interpretation = None

        ret = {"cellType": None,
               "coord_chrom" : None,
               "coord_start" : None,
               "coord_end" : None,
               "element_type": None,
               "approved_symbol": None,
               "interpretation": None}
        if "promoter" in toks or usetss:
            ret["element_type"] = "promoter-like"
            ret["rank_promoter_start"] = 164
            ret["rank_dnase_start"] = 164
            ret["gene_all_end"] = 5000
            s = s.replace("promoter", "")
        elif "enhancer" in toks:
            ret["element_type"] = "enhancer-like"
            ret["rank_enhancer_start"] = 164
            ret["rank_dnase_start"] = 164
            s = s.replace("enhancer", "")
        elif "insulator" in toks:
            ret["element_type"] = "insulator-like"
            ret["rank_ctcf_start"] = 164
            s = s.replace("insulator", "")

        accessions = []
        try:
            for t in toks:
                if isaccession(t):
                    accessions.append(t)
                    s = s.replace(t, "")
                    continue
                elif t.startswith("rs"):
                    coord = self._get_snpcoord(t)
                    s = s.replace(t, "")
                    if coord and not self.has_overlap(coord):
                        interpretation = "NOTICE: %s does not overlap any cREs; displaying any cREs within 2kb" % t
                        coord = Coord(coord.chrom, coord.start - 2000, coord.end + 2000)
                elif t.startswith("tssdist"):
                    tssdist = t.split("_")[1]
                    usetss = True
        except:
            print("could not parse " + s)

        if coord is None:
            interpretation, coord, s, notss = self._try_find_gene(s, usetss, tssdist)
            if interpretation:
                ret["approved_symbol"] = self._gene_alias_to_symbol(interpretation)
                interpretation = self.get_genetext(ret["approved_symbol"] if ret["approved_symbol"] else interpretation, usetss, notss, tssdist)

        s, cellType, _interpretation = self._find_celltype(s)

        if cellType is None:
            s, cellType, _interpretation = self._find_celltype(s, True)

        if len(accessions) > 0:
            coord = None
            cellType = None
            interpretation = None

        ret["cellType"] = cellType
        ret["interpretation"] = interpretation
        if coord:
            ret["coord_chrom"] = coord.chrom
            ret["coord_start"] = coord.start
            ret["coord_end"] = coord.end
        ret["accessions"] = accessions
        return ret
