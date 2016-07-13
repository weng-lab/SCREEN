from __future__ import print_function
import gzip
import json
import os

import sys
sys.path.append("../../../metadata/utils")
from helpers_metadata import Exp
from files_and_paths import Dirs

def main():

    encyclopedia_dir = os.path.join(Dirs.encyclopedia, "Version-4")
    genelist_fnp = os.path.join(encyclopedia_dir, "genelist.tsv")
    infnp = os.path.join(encyclopedia_dir, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.json.gz")
    outfnp = os.path.join(encyclopedia_dir, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.lsj.gz")

    cached = {}
    genelist = {}

    print("loading genelist...")
    with open(genelist_fnp, "r") as f:
        for line in f:
            line = line.split("\t")
            if len(line) < 10 or ":" not in line: continue
            genelist[line[0].split(":")[1]] = line[9]

    print("converting json objects...")
    i = 1
    with gzip.open(infnp, "r") as f:
        lines = [line for line in f][:-1]
    with gzip.open(outfnp, "wb") as o:
        for line in lines[1:]:
            print("working with object %d\r" % i, end="")
            sys.stdout.flush()
            i += 1
            line = line[:-2] if line.endswith(",\n") else line[:-1]
            obj = json.loads(line)
            if "ENSG" not in obj["ensembl_id"]:
                if obj["ensembl_id"] in genelist:
                    obj["ensembl_id"] = genelist[obj["ensembl_id"]]
                elif "0" + obj["ensembl_id"] in genelist:
                    obj["ensembl_id"] = genelist["0" + obj["ensembl_id"]]
                else:
                    print('"ensembl_id" %s could not be mapped' % obj["ensembl_id"])
                    continue
            for expressionset in obj["expression_values"]:
                if expressionset["dataset"] in cached:
                    expressionset["cell_line"] = cached[expressionset["dataset"]]
                else:
                    try:
                        e = Exp.fromJsonFile(expressionset["dataset"])
                        expressionset["cell_line"] = e.biosample_term_name
                        cached[expressionset["dataset"]] = e.biosample_term_name
                    except:
                        print("accession %s failed" % expressionset["dataset"])
                        continue
            o.write(json.dumps(obj) + "\n")

    return 0

if __name__ == "__main__":
    sys.exit(main())
