#!/usr/bin/env python3



import sys

from .query import query

def main(argc, argv):

    if argc < 4:
        print("usage: versioning assembly year month", file = sys.stderr)
        return 1

    results = query(argv[1], int(argv[2]), int(argv[3]))["@graph"]
    for e in results:
        print("%s\t%s\t%s" % (e["accession"], e["biosample_summary"].encode('ascii', 'ignore'), e["assay_term_name"]))

    return 0

if __name__ == "__main__":
    sys.exit(main(len(sys.argv), sys.argv))
