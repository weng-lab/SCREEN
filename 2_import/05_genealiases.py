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
from utils import Utils, printt

class GeneInfo:
    def __init__(self, assembly):
        self.assembly = assembly
        self.genes = self._load()

    def _load(self):
        if "mm10" == self.assembly:
            return self.processGeneListMm10()
        if "hg19" == self.assembly:
            return self.processGeneListHg19()
        raise Exception("unknown assembly: " + self.assembly)

    def loadHgnc(self):
        fnp = paths.hgncFnp
        ret = {}
        with open(fnp) as f:
            header = f.readline().rstrip().split('\t')
            #print(header)
            for line in f:
                toks = line.rstrip('\n').replace('"', '').split('\t')
                if len(toks) != len(header):
                    raise Exception("wrong len")
                g = dict(zip(header, toks))
                try:
                    gid = g["ensembl_gene_id"]
                except:
                    print(g)
                    print(header)
                    raise
                ret[gid] = g
        printt("loaded HGNC", len(ret))
        return ret

    def processGeneListHg19(self):
        printt(self.assembly, "loading HGNC gene info...")
        info = self.loadHgnc()

        printt(self.assembly, "loading GTF/GFF...")
        fnp, filetype = paths.gene_files[self.assembly]
        genes = Genes(fnp, filetype)

        printt(self.assembly, "processing genelist...")
        ret = {}

        for gene in genes.getGenes():
            ensemblid_ver = gene.geneid_
            if not ensemblid_ver.startswith("ENS"):
                print(gene)
                raise Exception("missing geneid_")
            g = gene.annot_
            g.update({"chr" : gene.chr_,
                      "start" : gene.start_,
                      "stop" : gene.end_,
                      "strand" : gene.strand_,
                      "source" : gene.source_})
            if ensemblid_ver in info:
                g.update(info[ensemblid_ver])
            ensemblid = ensemblid_ver.split('.')[0]
            if ensemblid in info:
                g.update(info[ensemblid])
            ret[ensemblid_ver] = g
        printt("processed", len(ret))
        return ret

    def processGeneListMm10(self):
        ret = {}

        fnp, filetype = paths.gene_files[self.assembly]
        ggff = Genes(fnp, filetype)

        for gene in ggff.getGenes():
            gid = gene.geneid_
            g = gene.annot_
            g.update({"chr" : gene.chr_,
                      "start" : gene.start_,
                      "stop" : gene.end_,
                      "strand" : gene.strand_,
                      "source" : gene.source_})
            ret[gid] = g
        printt("processed", len(ret))
        return ret

class GeneRow:
    def __init__(self, gid, info, gidsToDbID):
        try:
            self.ensemblid_ver = gid
            gidToks = gid.split('.')
            self.ensemblid = gidToks[0]
            self.ver = gidToks[1]
        except:
            self.ensemblid_ver = ''
            self.ensemblid = ''
            self.ver = '0'

        if not self.ver:
            #print("Missing ver:", gid, info)
            self.ver = '0'

        self.dbID = -1
        if self.ensemblid_ver in gidsToDbID:
            self.dbID = gidsToDbID[self.ensemblid_ver]
        elif self.ensemblid in gidsToDbID:
            self.dbID = gidsToDbID[self.ensemblid]

        self.info = info
        self.approved_symbol = info.get("gene_name", gid)
        self.chrom = info.get("chr", "")
        self.start = info.get("start", 0)
        self.stop = info.get("stop", 0)
        self.strand = info.get('strand', '')

        keysToRemove = ['chr', 'start', 'stop', "gene_name",
                        "gene_id", "ensembl_gene_id", "ID",
                        'gene_status', 'transcript_status',
                        'gene_type', 'source', 'level', 'strand',
                        'tag', "transcript_type",
                        'status', 'transcript_status',
                        'transcript_type', "locus_type",
                        "locus_group", "date_modified",
                        "date_approved_reserved"]
        self.info = {k:v for k, v in self.info.items() if k not in
                     keysToRemove and v and v != [""]}

    def output(self):
        return '\t'.join([str(self.dbID), self.ensemblid, self.ver,
                          self.ensemblid_ver, self.approved_symbol,
                          self.chrom, str(self.start), str(self.stop),
                          self.strand, json.dumps(self.info)])

def loadGidsToDbIds(assembly):
    fnp = paths.path(assembly, "raw", "ensebleToID.txt")

    printt("reading", fnp)
    with open(fnp) as f:
        rows = [line.rstrip('\n').split(',')
                for line in f.readlines() if line]
    gidsToDbID = {}
    requiredGids = {}
    for r in rows:
        if 3 != len(r):
            print(r)
            raise Exception("wrong num toks")
        gid = r[0]
        gidsToDbID[gid] = r[2]
        requiredGids[gid] = r[2]
        gidsToDbID[r[1]] = r[2]
    return gidsToDbID, requiredGids

class ImportGenes:
    def __init__(self, curs, assembly):
        self.assembly = assembly
        self.curs = curs

    def run(self):
        print('***********', self.assembly)

        gidsToDbID, requiredGids = loadGidsToDbIds(self.assembly)

        genes = GeneInfo(self.assembly).genes

        ret = {}
        for gid, info in genes.iteritems():
            ret[gid] = GeneRow(gid, info, gidsToDbID)
        printt("merged", len(ret))
        count = len(ret)

        for gid, ver in requiredGids.iteritems():
            if gid not in ret:
                ret[gid] = GeneRow(gid, {}, gidsToDbID)
        printt("loaded missing genes for DB", len(ret) - count)

        ret = ret.values()
        print("example\n", ret[0].output())

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
strand varchar(1),
info jsonb);
""".format(tableName = tableName))

        cols = ["geneid", "ensemblid", "ver", "ensemblid_ver",
                "approved_symbol", "chrom", "start", "stop",
                "strand", "info"]

        outF = StringIO.StringIO()
        for r in ret:
            outF.write(r.output() + '\n')
        outF.seek(0)
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        print("updated", tableName, self.curs.rowcount)

        makeIndex(self.curs, tableName, ["geneid"])

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for assembly in ["hg19", "mm10"]:
        with getcursor(DBCONN, "3_cellTypeInfo") as curs:
            aga = ImportGenes(curs, assembly)
            aga.run()

    return 0

if __name__ == '__main__':
    main()

