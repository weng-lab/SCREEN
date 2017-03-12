import os
import json

class DetermineTissue:
    # translate tissue name to tissue name
    lookupTissue = {}
    lookupTissue["hg19"] = {}
    lookupTissue["mm10"] = {"small intestine" : "intestine",
                            "large intestine" : "intestine",
                            "bone element" : "bone"}

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
        t = exp.jsondata["organ_slims"]
        if t:
            t = t[0]
        else:
            t = ""
        lookup = DetermineTissue.lookupTissue[assembly]
        if t in lookup:
            return lookup[t]
        ct = exp.biosample_term_name
        lookup = DetermineTissue.lookupBTN[assembly]
        if ct in lookup:
            return lookup[ct]
        if ct.endswith("erythroid progenitor cells"):
            return "blood"
        eprint(assembly, "missing tissiue assignemnt for", '"' + ct + '"')
        return ""
