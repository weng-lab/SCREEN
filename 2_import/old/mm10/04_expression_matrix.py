#!/usr/bin/env python

import os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from bulk_es_import import executable_importer
from files_and_paths import Dirs

def main():
    encyclopedia_dir = os.path.join(Dirs.encyclopedia, "Version-4")
    fnp = os.path.join(encyclopedia_dir, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.lsj.gz")
    importer = executable_importer(fnp, "expression_matrix", "gene")
    print("will import %s" % fnp)
    return importer.exe()

if __name__ == "__main__":
    sys.exit(main())
