#!/usr/bin/env python

from __future__ import print_function
import sys, os, argparse
import json

def main():
    for assembly in ["hg19", "mm10"]:
        fn = "cellTypeToTissue." + assembly + ".json"
        fnp = os.path.join(os.path.dirname(__file__),
                           "../../", fn)
        print(fnp)
        output = []
        with open(fnp) as f:
            ct = json.loads(f.read())
            
        for k, v in ct.iteritems():
            output.append({ "cell_type": k, "tissue": v })

        fn = "cellTypeToTissue." + assembly + ".lsj"
        fnp = os.path.join(os.path.dirname(__file__),
                           "../../", fn)
        with open(fnp, "wb") as o:
            for item in output:
                o.write(json.dumps(item) + "\n")
    return 0

if __name__ == "__main__":
    sys.exit(main())
