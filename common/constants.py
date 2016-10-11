import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../metadata/utils"))
from files_and_paths import Dirs
from v4_config import V4Config

chroms = {"hg19": ['chr1', 'chr10', 'chr11', 'chr12', 'chr13',
                   'chr14', 'chr15', 'chr16', 'chr17', 'chr18',
                   'chr19', 'chr2', 'chr20', 'chr21', 'chr22',
                   'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8',
                   'chr9', 'chrM', 'chrX', 'chrY'],
          "mm10": ['chr1', 'chr10', 'chr11', 'chr12', 'chr13',
                   'chr14', 'chr15', 'chr16', 'chr17', 'chr18',
                   'chr19', 'chr2',
                   'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8',
                   'chr9', 'chrM', 'chrX', 'chrY'] }

class paths:
    v4d = os.path.join(Dirs.encyclopedia, "Version-4")

    def ins_chr(fnp):
        def retval(_chr):
            parts = fnp.split(".")
            return "%s.%s.%s" % (parts[0], _chr, ".".join(parts[1:]))
        return retval
    
    re_json_vers = { 2 : {"origFnp" : [os.path.join(v4d, "regulatory-element-registry-hg19.V2.json.gz")],
                          "rewriteFnp" : [os.path.join(v4d, "regulatory-element-registry-hg19.V2.json.gz")],
                          "re_bed": os.path.join(v4d, "regulatory-element-registry-hg19.V2.bed.gz"),
                          "index" : "regulatory_elements_2"},
                     3 : {"origFnp" : [os.path.join(v4d, "regulatory-element-registry-hg19.V3.json.gz")],
                          "rewriteFnp" : [os.path.join(v4d, "regulatory-element-registry-hg19.V3.mod.json.gz")],
                          "re_bed": os.path.join(v4d, "regulatory-element-registry-hg19.V3.bed.gz"),
                          "index" : "regulatory_elements_3"},
                     4: {"origFnp": ins_chr(os.path.join(v4d, "regulatory-element-registry-hg19.V4.json.gz")),
                         "rewriteFnp": ins_chr(os.path.join(v4d, "regulatory-element-registry-hg19.V4.mod.json.gz")),
                         "re_bed": os.path.join(v4d, "regulatory-element-registry-hg19.V4.bed.gz"),
                         "index": "regulatory_elements_4"},
                     5: {"origFnp": ins_chr(os.path.join(v4d, "regulatory-element-registry-hg19.V5.json.gz")),
                         "rewriteFnp": ins_chr(os.path.join(v4d, "regulatory-element-registry-hg19.V5.mod.json.gz")),
                         "re_bed": os.path.join(v4d, "regulatory-element-registry-hg19.V5.bed.gz"),
                         "index": "regulatory_elements_5"} }

    @staticmethod
    def get_paths(version, chrs = None):
        retval = {}
        if version not in paths.re_json_vers: return retval
        for key, value in paths.re_json_vers[version].iteritems():
            if not hasattr(value, "__call__"):
                retval[key] = value
            else:
                retval[key] = [value(chrom) for chrom in chrs]
        return retval
    
    hexplots_dir = os.path.join(v4d, "hexplots")
    gene_files = {"hg19": (Dirs.GenomeFnp("gencode.v19/gencode.v19.annotation.gff3.gz"), "gff")}
    genelist = os.path.join(v4d, "genelist.tsv")
    genelsj = os.path.join(v4d, "genelist.lsj")
    genedb = os.path.join(v4d, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.json.gz")
    genedb_lsj = os.path.join(v4d, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.lsj.gz")
    snp_csvs = [("mm10", os.path.join(Dirs.dbsnps, "snps142common.mm10.csv")),
                ("hg19", os.path.join(Dirs.dbsnps, "snps144common.hg19.csv"))]
    snp_lsj = os.path.join(v4d, "snplist.lsj.gz")
    re_json_index = "regulatory_elements_4"
