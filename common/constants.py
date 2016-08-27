import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../metadata/utils"))
from files_and_paths import Dirs

class paths:
    v4d = os.path.join(Dirs.encyclopedia, "Version-4")

    re_json_vers = { 2 : {"origFnp" : os.path.join(v4d, "regulatory-element-registry-hg19.V2.json.gz"),
                          "rewriteFnp" : os.path.join(v4d, "regulatory-element-registry-hg19.V2.json.gz"),
                          "index" : "regulatory_elements_2"},
                     3 : {"origFnp" : os.path.join(v4d, "regulatory-element-registry-hg19.V3.json.gz"),
                          "rewriteFnp" : os.path.join(v4d, "regulatory-element-registry-hg19.V3.mod.json.gz"),
                          "index" : "regulatory_elements_3"}}

    re_json_version = 2
    re_json_orig = re_json_vers[re_json_version]["origFnp"]
    re_json_rewrite = re_json_vers[re_json_version]["rewriteFnp"]
    re_json_index = re_json_vers[re_json_version]["index"]
    
    hexplots_dir = os.path.join(v4d, "hexplots")
    gene_files = {"hg19": (Dirs.GenomeFnp("gencode.v19/gencode.v19.annotation.gff3.gz"), "gff")}
    genelist = os.path.join(v4d, "genelist.tsv")
    genelsj = os.path.join(v4d, "genelist.lsj")
    genedb = os.path.join(v4d, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.json.gz")
    genedb_lsj = os.path.join(v4d, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.lsj.gz")
    snp_csvs = [("mm10", os.path.join(Dirs.dbsnps, "snps142common.mm10.csv")),
                ("hg19", os.path.join(Dirs.dbsnps, "snps144common.hg19.csv"))]
    snp_lsj = os.path.join(v4d, "snplist.lsj.gz")
