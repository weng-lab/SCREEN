#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from get_tss import Genes
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils

class GeneInfo:
    def __init__(self, assembly):
        self.assembly = assembly
        self.gene_files = paths.gene_files

    def getEnsembleToInfo(self):
        if "mm10" == self.assembly:
            return self.processGeneListMm10()
        if "hg19" == self.assembly:
            return self.processGeneListHg19()
        raise Exception("unknown assembly: " + self.assembly)

    def getGeneCoords(self):
        if self.assembly not in self.gene_files:
            raise Exception("ERROR: cannot get gene coordinates for assembly " +
                            self.assembly + "-- no gene file found")
        fnp, filetype = self.gene_files[self.assembly]
        ggff = Genes(fnp, filetype)
        ret = {}
        for g in ggff.getGenes():
            ret[g.genename_] = "%s:%s-%s" % (g.chr_, g.start_, g.end_)
        return ret

    def tryparse(self, coord):
        if "-" not in coord or ":" not in coord:
            return {"chrom": "",
                    "start": -1,
                    "end": -1 }
        p = coord.split(":")
        v = p[1].split("-")
        return {"chrom": p[0],
                "start": int(v[0]),
                "end": int(v[1]) }

    def _parseLineHg19(self, line):
        line = line.strip().split("\t")
        while len(line) < 19:
            line.append("")
        g = {"ensemblid": line[9].strip(),
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
        return g

    def processGeneListHg19(self):
        print(self.assembly, "getting gene coordinates...")
        geneCoords = self.getGeneCoords()
        inFnp = paths.genelist[self.assembly]
        skipped = 0
        counter = 0

        ensembleToInfo = {}

        print(self.assembly, "processing genelist...")
        with open(inFnp, "r") as f:
            header = f.readline()
            for line in f:
                g = self._parseLineHg19(line)
                if "" == g["ensemblid"]:
                    skipped += 1
                    continue
                if g["approved_symbol"] in geneCoords:
                    g["coordinates"] = geneCoords[g["approved_symbol"]]
                    g["position"] = self.tryparse(g["coordinates"])
                ensembleToInfo[g["ensemblid"]] = g
                counter += 1
        print("\tprocessed", counter, "and skipped", skipped)
        return ensembleToInfo

    def _parseLineMm10(self, g):
        eid = g.geneid_.split('.')[0]
        gn = g.genename_
        # TODO: fixme!
        return {"ensemblid": eid,
                "approved_symbol": gn}

    def processGeneListMm10(self):
        skipped = 0
        counter = 0

        ensembleToInfo = {}

        fnp, filetype = paths.gene_files[self.assembly]
        ggff = Genes(fnp, filetype)
        outFnp = paths.genelsj[self.assembly]
        for gene in ggff.getGenes():
            g = self._parseLineMm10(gene)
            if "" == g["ensemblid"]:
                skipped += 1
                continue
            ensembleToInfo[g["ensemblid"]] = g
            counter += 1
        print("\tprocessed", counter, "and skipped", skipped)
        return ensembleToInfo

class GeneRow:
    def __init__(self, ensembleToInfo, toks):
        try:
            self.ver = toks[0].split('.')[1]
        except:
            print("ERROR:", toks)
            self.ver = "0"

        if not self.ver:
            print("ERROR", toks)
            self.ver = "0"

        self.ensemblid = toks[1]
        self.geneId = toks[2]

        if self.ensemblid in ensembleToInfo:
            self.info = ensembleToInfo[self.ensemblid]
            self.approved_symbol = self.info["approved_symbol"]
        elif toks[0] in ensembleToInfo:
            self.info = ensembleToInfo[toks[0]]
            self.approved_symbol = self.info["approved_symbol"]
        else:
            self.info = []
            self.approved_symbol = self.ensemblid

    def output(self):
        return '\t'.join([self.geneId, self.ensemblid, self.ver,
                          self.approved_symbol, json.dumps(self.info)])

class AddGeneAliases:
    def __init__(self, curs, assembly):
        self.assembly = assembly
        self.curs = curs
        self.ensembleToInfo = GeneInfo(assembly).getEnsembleToInfo()

    def run(self):
        d = os.path.join("/project/umw_zhiping_weng/0_metadata/encyclopedia/",
                         "Version-4", "ver9", self.assembly, "raw")
        fnp = os.path.join(d, "ensebleToID.txt")

        print("reading", fnp)
        with open(fnp) as f:
            rows = [GeneRow(self.ensembleToInfo, x.rstrip().split(','))
                    for x in f if x]
        print("loaded", len(rows))

        print(rows[0].output())

        tableName = self.assembly + "_gene_info"
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
geneid integer,
ensemblid text,
ver integer,
approved_symbol text,
info jsonb);""".format(tableName = tableName))

        cols = ["geneid", "ensemblid", "ver", "approved_symbol", "info"]

        outF = StringIO.StringIO()
        for r in rows:
            outF.write(r.output() + '\n')
        outF.seek(0)
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        print("updated", tableName)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for assembly in ["mm10", "hg19"]:
        with getcursor(DBCONN, "3_cellTypeInfo") as curs:
            aga = AddGeneAliases(curs, assembly)
            aga.run()

    return 0

if __name__ == '__main__':
    main()
