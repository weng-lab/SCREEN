#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from get_tss import Genes
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr
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

    def geneToCoord(self):
        if self.assembly not in self.gene_files:
            raise Exception("ERROR: cannot get gene coordinates for assembly " +
                            self.assembly + "-- no gene file found")
        fnp, filetype = self.gene_files[self.assembly]
        ggff = Genes(fnp, filetype)
        ret = {}
        for g in ggff.getGenes():
            ret[g.genename_] = (g.chr_, g.start_, g.end_)
        return ret

    def _parseLineHg19(self, line):
        line = line.strip().split("\t")
        while len(line) < 19:
            line.append("")
        g = {"ensemblid": line[9].strip(),
             "HGNC_ID": line[0],
             "approved_symbol": line[1],
             "approved_name": line[2],
             "previous_symbols": line[4].split(","),
             "synonyms": [x.strip() for x in line[5].split(",")],
             "accession_numbers": line[7],
             "RefSeq_ID": line[10],
             "UniProt_ID": line[14],
             "Vega_ID": line[16],
             "UCSC_ID": line[17],
             "mouse_genome_ID": line[18] }
        return g

    def processGeneListHg19(self):
        print(self.assembly, "getting gene coordinates...")
        geneCoords = self.geneToCoord()
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
                    chrom, start, stop = geneCoords[g["approved_symbol"]]
                    g["chrom"] = chrom
                    g["start"] = start
                    g["stop"] = stop
                ensembleToInfo[g["ensemblid"]] = g
                counter += 1
        print("\tprocessed", counter, "and skipped", skipped)
        return ensembleToInfo

    def _parseLineMm10(self, g):
        eid = g.geneid_.split('.')[0]
        gn = g.genename_
        # TODO: fixme!
        return {"ensemblid": eid,
                "approved_symbol": gn,
                "chrom" : g.chr_,
                "start" : g.start_,
                "stop" : g.end_}

    def processGeneListMm10(self):
        skipped = 0
        counter = 0

        ensembleToInfo = {}

        fnp, filetype = paths.gene_files[self.assembly]
        ggff = Genes(fnp, filetype)
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
        self.ensemblid_ver = toks[0]
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
            self.chrom = self.info.get("chrom", "")
            self.start = self.info.get("start", 0)
            self.stop = self.info.get("stop", 0)
        elif toks[0] in ensembleToInfo:
            self.info = ensembleToInfo[toks[0]]
            self.approved_symbol = self.info["approved_symbol"]
            self.chrom = self.info.get("chrom", "")
            self.start = self.info.get("start", 0)
            self.stop = self.info.get("stop", 0)
        else:
            self.info = {}
            self.approved_symbol = self.ensemblid_ver
            self.chrom = ""
            self.start = 0
            self.stop = 0

        self.info = {k:v for k, v in self.info.items() if k not in
                     ['chrom', 'start', 'stop', "approved_symbol",
                      "ensemblid"] and v and v != [""]}

    def output(self):
        return '\t'.join([self.geneId, self.ensemblid, self.ver,
                          self.ensemblid_ver, self.approved_symbol,
                          self.chrom, str(self.start), str(self.stop),
                          json.dumps(self.info)])

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
ensemblid_ver text,
approved_symbol text,
        chrom text,
        start integer,
        stop integer,
info jsonb);""".format(tableName = tableName))

        cols = ["geneid", "ensemblid", "ver", "ensemblid_ver", "approved_symbol",
                "chrom", "start", "stop", "info"]

        outF = StringIO.StringIO()
        for r in rows:
            outF.write(r.output() + '\n')
        outF.seek(0)
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        print("updated", tableName)

        makeIndex(self.curs, tableName, ["geneid"])

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
