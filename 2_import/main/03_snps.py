#!/usr/bin/env python

import os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
sys.path.append("../common")
from bulk_es_import import executable_importer
from files_and_paths import Dirs

def main():
    fnp = os.path.join(Dirs.encyclopedia, "Version-4", "snplist.lsj")
    importer = executable_importer(fnp, "snp_aliases", "snp")
    print("will import %s" % fnp)
    return importer.exe()

if __name__ == "__main__":
    sys.exit(main())
