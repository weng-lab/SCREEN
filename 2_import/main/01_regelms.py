#!/usr/bin/env python

import os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from bulk_es_import import executable_importer
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs

def main():
    print("importing", paths.re_json_version)
    importer = executable_importer(paths.re_json_rewrite,
                                   paths.re_json_index,
                                   "element")
    importer.exe()

if __name__ == "__main__":
    sys.exit(main())
