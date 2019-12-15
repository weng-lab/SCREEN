#!/usr/bin/env python3

import sys
import os
import random

fixedmap = {"limb": "limb",
            "embryonic facial prominence": "embryonic structure",
            "CH12.LX": "blood",
            "neural tube": "neural tube",
            "intestine": "intestine",
            "hematopoietic stem cell": "blood",
            "G1E": "embryonic stem cell",
            "MEP": "blood",
            "G1E-ER4": "embryonic stem cell",
            "CMP": "blood"}


class TissueColors:
    def __init__(self, cache):
        self.cache = cache
        self.tissueToColor = self.cache.colors["tissues"]
        self.randColorGen = lambda: random.randint(0, 255)

    def randColor(self):
        return '#%02X%02X%02X' % (self.randColorGen(),
                                  self.randColorGen(),
                                  self.randColorGen())

    def getTissueColor(self, t):
        if t not in self.tissueToColor:
            #print("missing tissue color for", t)
            return self.randColor()
        c = self.tissueToColor[t]
        if not c.startswith('#'):
            return '#' + c
        return c


def main():
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
    sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
    sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
    from postgres_wrapper import PostgresWrapper
    from pg import PGsearch
    from dbconnect import db_connect
    from cached_objects import CachedObjects

    testCONN = db_connect(os.path.realpath(__file__))
    ps = PostgresWrapper(testCONN)

    # GE
    for assembly in ["hg19", "mm10"]:
        pgSearch = PGsearch(ps, assembly)
        cache = CachedObjects(ps, assembly)
        tissueToColor = cache.colors["tissues"]

        for t in pgSearch.geneExpressionTissues():
            if t not in tissueToColor:
                print("missing", t)

    # RAMPAGE
    for assembly in ["hg19"]:
        pgSearch = PGsearch(ps, assembly)
        cache = CachedObjects(ps, assembly)
        ri = pgSearch.rampage_info()
        tissueToColor = cache.colors["tissues"]

        for fileID, info in ri.items():
            t = info["tissue"]
            if t not in tissueToColor:
                print("missing", t)


if __name__ == "__main__":
    main()
