import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from files_and_paths import Dirs

class paths:
    v4d = os.path.join(Dirs.encyclopedia, "Version-4")
    re_json_orig = os.path.join(v4d, "regulatory-element-registry-hg19.V3.json.gz")
    re_json_rewrite = os.path.join(v4d, "regulatory-element-registry-hg19.V3.mod.json.gz")
    hexplots_dir = os.path.join(v4d, "hexplots")
    gene_files = {"hg19": (Dirs.GenomeFnp("gencode.v19/gencode.v19.annotation.gff3.gz"), "gff")}
    genelist = os.path.join(v4d, "genelist.tsv")
    genelsj = os.path.join(v4d, "genelist.lsj")
    genedb = os.path.join(v4d, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.json.gz")
    genedb_lsj = os.path.join(v4d, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.lsj.gz")
    snp_csvs = [("mm10", os.path.join(Dirs.dbsnps, "snps142common.mm10.csv")),
                ("hg19", os.path.join(Dirs.dbsnps, "snps144common.hg19.csv"))]
    snp_lsj = os.path.join(v4d, "snplist.lsj.gz")
