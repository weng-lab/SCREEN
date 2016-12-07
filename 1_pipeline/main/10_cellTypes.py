#!/usr/bin/env python

from __future__ import print_function
import sys, os, argparse
import json

def main():
    output = []
    with open(os.path.join(os.path.dirname(__file__), "../../celltypes.json"), "r") as f:
        ct = json.loads(f.read())
    for k, v in ct.iteritems():
        output.append({ "cell_type": k, "tissue": v })
    with open(os.path.join(os.path.dirname(__file__), "../../celltypes.lsj"), "wb") as o:
        for item in output:
            o.write(json.dumps(item) + "\n")
    return 0

if __name__ == "__main__":
    sys.exit(main())
