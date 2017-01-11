#!/usr/bin/env python

import os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from bulk_es_import import executable_importer
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from files_and_paths import Dirs

def main():
    for assembly in ["hg19", "mm10"]:
        fnp = paths.genelsj[assembly]
        importer = executable_importer(fnp,
                                       "gene_aliases_" + assembly,
                                       "gene")
        importer.exe()

if __name__ == "__main__":
    sys.exit(main())
