#!/usr/bin/env python

import os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from bulk_es_import import executable_importer
from files_and_paths import Dirs

from constants import paths

def main():
    fnp = paths.re_json_rewrite
    importer = executable_importer(fnp, "regulatory_elements", "element")
    return importer.exe()

if __name__ == "__main__":
    sys.exit(main())
