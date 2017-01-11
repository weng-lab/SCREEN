#!/usr/bin/env python

from __future__ import print_function

from collections import namedtuple
import string
import json
import os
import sys
import argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from exp import Exp
from db_utils import getcursor

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from dbconnect import db_connect
from elastic_search_wrapper import ElasticSearchWrapper
from elasticsearch import Elasticsearch
from constants import paths

Biosample = namedtuple("Biosample", "biosample_type biosample_term_name summary es_name tissue")

class BiosampleRow:
    # translate tissue name to tissue name
    lookupTissue = {}
    lookupTissue["hg19"] = {}
    lookupTissue["mm10"] = {"small intestine" : "intestine",
                            "large intestine" : "intestine",
                            "bone element" : "bone"}

    # translate biosample term name
    lookupBTN = {}
    fnp = os.path.join(os.path.dirname(__file__),
                       "../../cellTypeToTissue.hg19.json.new")
    lookupBTN["hg19"] = json.load(open(fnp))
    fnp = os.path.join(os.path.dirname(__file__),
                       "../../cellTypeToTissue.mm10.json")
    lookupBTN["mm10"] = json.load(open(fnp))

    def __init__(self, expID, assembly):
        self.expID = expID
        self.assembly = assembly

    def _translateTissue(self, exp):
        t = exp.jsondata["organ_slims"]
        if t:
            t = t[0]
        else:
            t = ""
        lookup = BiosampleRow.lookupTissue[self.assembly]
        if t in lookup:
            return lookup[t]
        ct = exp.biosample_term_name
        lookup = BiosampleRow.lookupBTN[self.assembly]
        if ct in lookup:
            return lookup[ct]
        if ct.endswith("erythroid progenitor cells"):
            return "blood"
        return ""

    def parse(self):
        exp = Exp.fromJsonFile(self.expID)
        ct = exp.biosample_term_name

        summary = exp.jsondata.get("biosample_summary", ct)

        tbl = string.maketrans(' ./', '__-')
        es_name = str(summary).translate(tbl, '()').replace('__', '_')
        
        tissue = self._translateTissue(exp)
        
        return Biosample(exp.biosample_type,
                         exp.biosample_term_name,
                         summary,
                         es_name,
                         tissue)

class BiosamplesBase(object):
    def __init__(self, assembly, DBCONN):
        self.assembly = assembly
        self.DBCONN = DBCONN
        self.tableName = "biosamples_" + assembly

class BiosamplesMaker(BiosamplesBase):
    def __init__(self, assembly, DBCONN, curs, d):
        BiosamplesBase.__init__(self, assembly, DBCONN)
        self.curs = curs
        self.d = d
        
    def run(self):
        rows = self._load()
        for r in rows:
            if 0: print('; '.join(r))
        self._setupDb()
        for r in rows:
            self._insertDb(r)

    def _load(self):
        rows = set()
        # hack in old cell type names (pre V8)
        if "hg19" == self.assembly:
            es = ElasticSearchWrapper(Elasticsearch(), "hg19")
            r = es.get_field_mapping(index = paths.reJsonIndex(self.assembly),
                                     doc_type = "element",
                                     field = "ranks.dnase")
            ctsRaw = sorted(r["datapairs"], key=lambda s: s[0].lower())
            cts = [e[0] for e in ctsRaw]
                        
            fnp = os.path.join(os.path.dirname(__file__),
                               "../../cellTypeToTissue.hg19.json.old")
            lookup = json.load(open(fnp))
            for ct in cts:
                if ct in lookup and lookup[ct]: 
                    tissue = lookup[ct]
                else:
                    print("missing " + ct)
                typ = "tissue"
                if "primary_cell" in ct:
                    typ = "primary cell"
                elif "immortalized" in ct:
                    typ = "immortalized cell lines"
                b = Biosample(typ, ct, ct, ct, tissue)
                rows.add(b)

            cts = set(cts)
            for ct, tissues in lookup.iteritems():
                if ct in cts:
                    continue
                if not tissue:
                    print("missing tissue for " + ct)
                typ = "tissue"
                if "primary_cell" in ct:
                    typ = "primary cell"
                elif "immortalized" in ct:
                    typ = "immortalized cell lines"
                b = Biosample(typ, ct, ct, ct, tissue)
                rows.add(b)
                
        else:
            for fn in os.listdir(self.d):
                if not fn.startswith(self.assembly) or "bigwig" not in fn:
                    continue
                fnp = os.path.join(self.d, fn)
                print(fnp)
                with open(fnp) as f:
                    data = [line.rstrip().split('\t') for line in f.readlines()[1:]]
                expIDs = list(set([x[0] for x in data]))

                for expID in expIDs:
                    row = BiosampleRow(expID, self.assembly).parse()
                    rows.add(row)
        return rows

    def _setupDb(self):
        print("\tdropping and creating", self.tableName)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tableName};
        CREATE TABLE {tableName}
        (id serial PRIMARY KEY,
        biosample_type text NOT NULL,
        biosample_term_name text NOT NULL,
        summary text NOT NULL,
        es_name text NOT NULL,
        tissue text
        ) """.format(tableName = self.tableName))

    def _insertDb(self, r):
        self.curs.execute("""
        INSERT INTO {tableName}
        (biosample_type, biosample_term_name, summary, es_name, tissue)
        VALUES (
        %(biosample_type)s,
        %(biosample_term_name)s,
        %(summary)s,
        %(es_name)s,
        %(tissue)s)""".format(tableName = self.tableName),
                          {"biosample_type" : r.biosample_type,
                           "biosample_term_name" : r.biosample_term_name,
                           "summary" : r.summary,
                           "es_name" : r.es_name,
                           "tissue" : r.tissue
                          })

class Biosamples(BiosamplesBase):
    def __init__(self, assembly, DBCONN):
        BiosamplesBase.__init__(self, assembly, DBCONN)

        with getcursor(DBCONN, "biosample") as curs:
            curs.execute("""
select biosample_type, biosample_term_name, summary, es_name, tissue
from {tableName}
ORDER BY LOWER(biosample_term_name), LOWER(tissue)
""".format(tableName = self.tableName))
            self.rows = [Biosample(*r) for r in curs.fetchall()]
        self.esToBio = {b.es_name : b for b in self.rows}

        # for reactjs 
        self.cellTypesAndTissues = [{"value": b.es_name,
                                     "tissue": b.tissue} for b in self.rows]
        self.cellTypesAndTissues_json = json.dumps(self.cellTypesAndTissues)
        self.tissueMap = {x["value"]: x["tissue"] for x in
                          self.cellTypesAndTissues}

        self.biosample_types = sorted(list(set([b.biosample_type for b in self.rows])))
        
    def __iter__(self):
        return iter(self.rows)

    def __contains__(self, es_name):
        return es_name in self.esToBio            
    
    def __getitem__(self, es_name):
        return self.esToBio[es_name]

    def biosampleTypes(self):
        return self.biosample_types
    
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--assembly', type=str, default="mm10")
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    if 0:
        biosamples = Biosamples(args.assembly, DBCONN)
        for b in biosamples:
            print(b)
        print('***************')
        print(biosamples["C57BL-6_brain_male_embryo_18_5_days"])
    if 1:
        biosamples = Biosamples("hg19", DBCONN)
        print('***************')
        print(biosamples["foreskin_fibroblast_primary_cell_male_newborn_1"])

if __name__ == "__main__":
    sys.exit(main())
