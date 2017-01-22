#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer

from joblib import Parallel, delayed

def _getcorr_(qTableName, field, i, l, threshold, torun, local):
    DBCONN = db_connect(os.path.realpath(__file__), local)
    torun = [torun[n] for n in xrange(len(torun)) if torun[n] > i]
    with Timer("computing correlation for ct %d/%d, assay %s" % (i, l, field)):
        q = ", ".join(["corr(%s[%d], %s[%d])" % (field + "_zscore", i + 1, field + "_zscore", j + 1)
                       for j in torun])
        with getcursor(DBCONN, "Correlate::setupTable") as curs:
            curs.execute("SELECT {q} FROM {tableName} WHERE intarray2int4range({field}) && int4range(0, {threshold})".format(tableName=qTableName,
                                                                                                                             threshold=threshold,
                                                                                                                             field=field + "_rank",
                                                                                                                             q=q))
            r = curs.fetchone()
    ret = [0.0 for n in xrange(l)]
    for n in xrange(len(torun)):
        ret[torun[n]] = r[n]
    return ret[i + 1:]

class Correlate:
    
    def __init__(self, DBCONN, assembly, args):
        self.DBCONN = DBCONN
        self.tableName = "correlations_" + assembly
        self.qTableName = assembly + "_cre"
        self.j = args.j
        self.local = args.local
        
    def setupTable(self):
        print("dropping and creating", self.tableName, "...")
        with getcursor(self.DBCONN, "Correlate::setupTable") as curs:
            curs.execute("""
            DROP TABLE IF EXISTS {tableName};
            CREATE TABLE {tableName}
            (id serial PRIMARY KEY,
            assay VARCHAR(70),
            correlations float[][]);""".format(tableName = self.tableName))

    def _getarrlen(self, field):
        with getcursor(self.DBCONN, "Correlate::setupTable") as curs:
            curs.execute("SELECT array_length((SELECT {field} from {tableName} LIMIT 1), 1)".format(field = field, tableName = self.qTableName))
            r = curs.fetchone()[0]
        return r

    def _getcorr(self, field, i, l, threshold, torun):
        return _getcorr_(self.qTableName, field, i, l, threshold, torun, self.local)

    def run(self, assay, groups = [("", None)], labels = None):
        for group in groups:
            l = self._getarrlen(assay + "_rank")
            if not group[1] or not labels:
                torun = [i for i in xrange(l)]
            else:
                torun = []
                for i in xrange(len(labels)):
                    if group[1](labels[i]):
                        torun.append(i)
            _l = len(torun)
            print("NOTICE: beginning run for %s:%s (%d cell types)" % (assay, group[0], _l))
            if _l > 100:
                print("WARNING: length %d for assay %s could take too much time to compute; skipping" % (_l, assay))
                return
            corrs = [[1.0 for ct in xrange(l)] for ct in xrange(l)]
            results = Parallel(n_jobs=self.j)(delayed(_getcorr_)(self.qTableName, assay, ct, l, 20000, torun, self.local)
                                              for ct in torun)
            for _ct in xrange(len(results)):
                r = results[_ct]
                ct = torun[_ct]
                for i in range(ct + 1, l):
                    corrs[ct][i] = r[i - ct - 1]
                    corrs[i][ct] = r[i - ct - 1]
            with getcursor(self.DBCONN, "Correlate::setupTable") as curs:
                _assay = assay
                if group[0] != "": _assay += "_" + group[0]
                curs.execute("INSERT INTO {tableName} (assay, correlations) VALUES (%(assay)s, %(corrs)s)".format(tableName = self.tableName),
                             {"assay": _assay, "corrs": corrs})

class ImportData:
    def __init__(self, curs, chrs, baseTableName, cols):
        self.curs = curs
        self.chrs = chrs
        self.baseTableName = baseTableName
        self.all_cols = cols

    def setupTable(self, tableName):
        print("dropping and creating", tableName, "...")
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};

    CREATE TABLE {tableName}
        (id serial PRIMARY KEY,
        accession VARCHAR(20),
        mpName text,
        negLogP real,
        chrom VARCHAR(5),
        start integer,
        stop integer,
        conservation_rank integer[],
        conservation_signal numeric(8,3)[],
        dnase_rank integer[],
        dnase_signal numeric(8,3)[],
        dnase_zscore numeric(8,3)[],
        ctcf_only_rank integer[],
        ctcf_only_zscore numeric(8,3)[],
        ctcf_dnase_rank integer[],
        ctcf_dnase_zscore numeric(8,3)[],
        h3k27ac_only_rank integer[],
        h3k27ac_only_zscore numeric(8,3)[],
        h3k27ac_dnase_rank integer[],
        h3k27ac_dnase_zscore numeric(8,3)[],
        h3k4me3_only_rank integer[],
        h3k4me3_only_zscore numeric(8,3)[],
        h3k4me3_dnase_rank integer[],
        h3k4me3_dnase_zscore numeric(8,3)[]
        ); """.format(tableName = tableName))
        #print("created", tableName)

    def importTsv(self, tn, fnp):
        cols = self.all_cols
        with open(fnp) as f:
            print("importing", fnp, "into", tn)
            self.curs.copy_from(f, tn, '\t', columns=cols)
        #print("imported", os.path.basename(fnp))

    def run(self, d):
        self.setupTable(self.baseTableName)

        for chrom in self.chrs:
            fnp = os.path.join(d, "parsed." + chrom + ".tsv")
            ctn = self.baseTableName + '_' + chrom
            self.setupTable(ctn)
            self.importTsv(self.baseTableName, fnp)
            self.importTsv(ctn, fnp)

class CreateIndices:
    def __init__(self, curs, chrs, baseTableName, cols):
        self.curs = curs
        self.chrs = chrs
        self.baseTableName = baseTableName
        self.all_cols = cols
        self.rank_cols = [x for x in cols if x.endswith("_rank")]
        self.signal_cols = [x for x in cols if x.endswith("_signal")]
        self.zscore_cols = [x for x in cols if x.endswith("_zscore")]

    def _idx(self, tn, col, suf = ""):
        if suf:
            return tn + '_' + col + '_' + suf + "_idx"
        return tn + '_' + col + "_idx"

    def doIndex(self, tableName):
        cols = ("accession", "chrom", "start", "stop",)
        for col in cols:
            idx = self._idx(tableName, col)
            print("indexing", idx)
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    CREATE INDEX {idx} on {tableName} ({col});
    """.format(idx = idx, tableName = tableName, col = col))

        cols = ("neglogp",)
        for col in cols:
            idx = self._idx(tableName, col)
            print("indexing", idx, "DESC")
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    CREATE INDEX {idx} on {tableName} ({col} DESC);
    """.format(idx = idx, tableName = tableName, col = col))

    def doIndexGin(self, tableName): # best for '<@' operator on element of array
        cols = self.rank_cols + self.signal_cols + self.zscore_cols
        for col in cols:
            idx = self._idx(tableName, col, "gin")
            print("indexing", idx)
            self.curs.execute("""
    CREATE INDEX {idx} on {tableName} USING GIN ({col});
    """.format(idx = idx, tableName = tableName, col = col))

    def setupRangeFunction(self):
        print("create range function...")
        self.curs.execute("""
    create or replace function intarray2int4range(arr int[]) returns int4range as $$
        select int4range(min(val), max(val) + 1) from unnest(arr) as val;
    $$ language sql immutable;

    create or replace function numarray2numrange(arr numeric[]) returns numrange as $$
        select numrange(min(val), max(val) + 1) from unnest(arr) as val;
    $$ language sql immutable;
    """)

    def setupSimilarFunction(self):
        print("create similarity function...")
        self.curs.execute("""
        create or replace function intarraysimilarity(arr1 int[], arr2 int[], threshold int) returns int as $$
        declare ret int := 0; begin
        for i in array_lower(arr1, 1)..array_upper(arr1, 1) loop
           ret := case when arr1[i] < threshold and arr2[i] < threshold then ret + 1
                       when arr1[i] >= threshold and arr2[i] >= threshold then ret + 1
                       else ret
                  end;
        end loop;
        return ret; end; $$ language plpgsql stable returns null on null input;""")

    def run(self):
        self.setupRangeFunction()
        self.setupSimilarFunction()
        self.doIndex(self.baseTableName)
        self.doIndexGin(self.baseTableName)
        self.doIndexRange(self.baseTableName)

        for chrom in self.chrs:
            ctn = self.baseTableName + '_' + chrom
            self.doIndex(ctn)
            self.doIndexGin(ctn)
            self.doIndexRange(ctn)

    def doIndexRange(self, tableName):
        cols = self.rank_cols
        for col in cols:
            idx = self._idx(tableName, col)
            print("indexing int range", idx)
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    create index {idx} on {tableName} using gist(intarray2int4range({col}));
    """.format(idx = idx, tableName = tableName, col = col))

        cols = self.signal_cols + self.zscore_cols
        for col in cols:
            idx = self._idx(tableName, col)
            print("indexing numeric range", idx)
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    create index {idx} on {tableName} using gist(numarray2numrange({col}));
    """.format(idx = idx, tableName = tableName, col = col))

    def vacumnAnalyze(self, conn):
        # http://stackoverflow.com/a/1017655
        print("about to vacuum analyze", self.baseTableName)
        old_isolation_level = conn.isolation_level
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        curs = conn.cursor()
        curs.execute("vacuum analyze " + self.baseTableName)
        for chrom in self.chrs:
            ctn = self.baseTableName + '_' + chrom
            print("about to vacuum analyze", ctn)
            curs.execute("vacuum analyze " + ctn)
        conn.set_isolation_level(old_isolation_level)
        print("done")

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--setup', action="store_true", default=False)
    parser.add_argument('--index', action="store_true", default=False)
    parser.add_argument('--vac', action="store_true", default=False)
    parser.add_argument('--correlate', action="store_true", default=False)
    parser.add_argument('--setupsimilar', action="store_true", default=False)
    parser.add_argument('--j', type=int, default=4)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()
    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    d = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver8/mm10/newway/"

    mm10_chrs = ["chr1", "chr2", "chr3", "chr4", "chr5",
                 "chr6", "chr7", "chr8", "chr9", "chr10", "chr11", "chr12",
                 "chr13", "chr14", "chr15", "chr16", "chr17", "chr18", "chr19",
                 "chrX", "chrY"]

    cols = ("accession", "mpName", "negLogP", "chrom", "start", "stop",
            "conservation_rank", "conservation_signal",
 	    "dnase_rank", "dnase_signal", "dnase_zscore",
	    "ctcf_only_rank", "ctcf_only_zscore",
 	    "ctcf_dnase_rank", "ctcf_dnase_zscore",
 	    "h3k27ac_only_rank", "h3k27ac_only_zscore",
 	    "h3k27ac_dnase_rank", "h3k27ac_dnase_zscore",
 	    "h3k4me3_only_rank", "h3k4me3_only_zscore",
 	    "h3k4me3_dnase_rank", "h3k4me3_dnase_zscore")

    chrs = mm10_chrs

    groups = [("tissue", lambda x: "tissue" in x),
              ("immortalized", lambda x: "immortalized" in x),
              ("primary_cell", lambda x: "primary_cell" in x) ]

    if args.correlate:
        celltypemap = {}
        with getcursor(DBCONN, "copy_to_db$main") as curs:
            curs.execute("select idx, celltype, rankmethod from {assembly}_rankcelltypeindexex".format(assembly="hg19"))
            results = curs.fetchall()
        _map = {}
        for result in results:
            _map[result[2]] = [(result[0], result[1])] if result[2] not in _map else _map[result[2]] + [(result[0], result[1])]
        for k, v in _map.iteritems():
            k = k.lower()
            celltypemap[k] = [x[1] for x in sorted(v, lambda a, b: a[0] - b[0])]
        c = Correlate(DBCONN, "hg19", args)
        c.setupTable()
        for assay in ["h3k27ac_only", "ctcf_only", "h3k4me3_only", "dnase",
                      "h3k27ac_dnase", "h3k4me3_dnase", "ctcf_dnase" ]:
            c.run(assay, groups, celltypemap[assay.replace("_", "-")])
        return 0

    if args.setupsimilar:
        with getcursor(DBCONN, "08_setup_log") as curs:
            CreateIndices(curs, chrs, "", cols).setupSimilarFunction()
        return 0
    
    with getcursor(DBCONN, "08_setup_log") as curs:
        tableName = "mm10_cre"

        im = ImportData(curs, chrs, tableName, cols)
        ci = CreateIndices(curs, chrs, tableName, cols)

        if args.setup:
            im.run(d)
            ci.vacumnAnalyze(DBCONN.getconn())
        elif args.index:
            ci.run()
        elif args.vac:
            ci.vacumnAnalyze(DBCONN.getconn())
        else:
            im.run(d)
            ci.vacumnAnalyze(DBCONN.getconn())
            ci.run()

if __name__ == '__main__':
    main()
