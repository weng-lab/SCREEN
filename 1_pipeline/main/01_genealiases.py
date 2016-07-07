from __future__ import print_function
import json
import sys
import os
import requests

sys.path.append("../../../metadata/utils")
from files_and_paths import Dirs, Tools, Genome, Datasets

def main():
    infnp = os.path.join(Dirs.encyclopedia, "Version-4", "genelist.tsv")
    outfnp = os.path.join(Dirs.encyclopedia, "Version-4", "genelist.lsj")
    i = -1
    skipped = 0
    with open(infnp, "r") as f:
        with open(outfnp, "wb") as o:
            for line in f:
                i += 1
                if i == 0: continue
                line = line.strip().split("\t")
                while len(line) < 19:
                    line.append("")
                geneobj = {"ensemblid": line[9],
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
                if geneobj["ensemblid"].strip() == "":
                    skipped += 1
                    continue
                try:
                    result = requests.get("http://useast.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=%s" % geneobj["ensemblid"],
                                          allow_redirects = False)
                except:
                    print("unable to get chromosome region for %s; skipping" % geneobj["ensemblid"])
                geneobj["coordinates"] = result.headers["Location"].split("r=")[1]
                o.write(json.dumps(geneobj) + "\n")
    print("wrote %d gene objects less %d skipped" % (i, skipped), end="")
    return 0

if __name__ == "__main__":
    sys.exit(main())
