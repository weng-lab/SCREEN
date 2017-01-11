#!/usr/bin/env python

import os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../common"))
from bulk_es_import import executable_importer

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../../metadata/utils'))
from files_and_paths import Dirs

def main():
    encyclopedia_dir = os.path.join(Dirs.encyclopedia, "Version-4")
    fnp = os.path.join(encyclopedia_dir, "beds.lsj")
    importer = executable_importer(fnp, "peak_beds", "bed")
    print("will import %s" % fnp)
    return importer.exe()

if __name__ == "__main__":
    sys.exit(main())
