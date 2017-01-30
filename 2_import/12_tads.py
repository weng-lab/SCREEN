#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from db_utils import getcursor
from files_and_paths import Dirs
from querydcc import QueryDCC

class ImportTADs:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_" + "tads"

    def setupTable(self):
        print("dropping and creating table", self.tableName)
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
    CREATE TABLE {tableName}(
    id serial PRIMARY KEY,
    chrom text,
    start integer,
    stop integer
    );
    """.format(tableName = self.tableName))
        print("\tok")

    def run(self):
        fileIDs = """ENCFF558RGV
ENCFF336WPU
ENCFF451MCF
ENCFF310FEU
ENCFF437EBV
ENCFF784LMI
ENCFF032FMN
ENCFF471EYL
ENCFF588KUZ
ENCFF938WXQ
ENCFF701HCM
ENCFF931RKD""".split('\n')

        fnps = []
        qd = QueryDCC()
        for fileID in fileIDs:
            fo = qd.getFileObjFromFileID(fileID)
            fnp = fo.fnp()
            print(fnp)
            fnps.append(fnp)

        cmds = ["zcat", " ".join(fnps),
                '|', "sort -k1,1 -k2,2n"
                '|', "bedtools merge"]
        f = StringIO.StringIO()
        f.write(''.join(Utils.runCmds(cmds)))
        f.seek(0)

        self.setupTable()
        self.curs.copy_from(f, self.tableName, '\t',
                          columns=("chrom", "start", "stop"))
        print("\tcopied in bedtools merge TADs", self.curs.rowcount)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for assembly in ["hg19"]:
        with getcursor(DBCONN, "main") as curs:
            ipi = ImportTADs(curs, assembly)
            ipi.run()

if __name__ == '__main__':
    main()
