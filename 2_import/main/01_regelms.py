#!/usr/bin/env python

import os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from bulk_es_import import executable_importer
from files_and_paths import Dirs

def main():
    fnp = os.path.join(Dirs.encyclopedia, "Version-4", "regulatory-element-registry-hg19.V2.json.gz")
    importer = executable_importer(fnp, "regulatory_elements", "element")
    return importer.exe()

if __name__ == "__main__":
    sys.exit(main())
