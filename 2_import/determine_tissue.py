#!/usr/bin/env python3


import os
import sys
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '../utils'))
from utils import Utils, eprint, AddPath


class DetermineTissue:
    # translate tissue name to tissue name
    lookupTissue = {}
    lookupTissue["hg19"] = {}
    lookupTissue["mm10"] = {"small intestine": "intestine",
                            "large intestine": "intestine",
                            "bone element": "bone"}

    # translate biosample term name
    lookupBTN = {}
    fnp = os.path.join(os.path.dirname(__file__),
                       "../cellTypeToTissue.hg19.json")
    lookupBTN["hg19"] = json.load(open(fnp))
    fnp = os.path.join(os.path.dirname(__file__),
                       "../cellTypeToTissue.mm10.json")
    lookupBTN["mm10"] = json.load(open(fnp))

    @staticmethod
    def TranslateTissue(assembly, exp):
        t = exp.jsondata.get("organ_slims", "")
        if t:
            t = sorted(t)[0]
        else:
            t = ""
        lookup = DetermineTissue.lookupTissue[assembly]
        if t in lookup:
            return lookup[t]
        ct = exp.biosample_term_name
        lookup = DetermineTissue.lookupBTN[assembly]
        if ct in lookup:
            return lookup[ct]
        ct = exp.jsondata.get("biosample_summary", "")
        if ct in lookup:
            return lookup[ct]
        if ct and ct.endswith("erythroid progenitor cells"):
            return "blood"
        if "ENCSR626RVD" == exp.encodeID:
            return "brain"
        if "ENCSR820WLP" == exp.encodeID:
            return "stem cells"
        eprint(assembly, "missing tissiue assignemnt for", exp.encodeID, exp.biosample_term_name)
        return ""
