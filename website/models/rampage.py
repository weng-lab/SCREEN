class Rampage:
    def __init__(self, assembly, pgSearch):
        self.assembly = assembly
        self.pgSearch = pgSearch

    def _procees(self, ri, r):
        ret = {}
        ret["gene"] = r["ensemblid_ver"]
        ret["tss"] = r["tss"]
        ret["chrom"] = r["chrom"]
        ret["start"] = r["start"]
        ret["stop"] = r["stop"]
        ret["items"] = {}

        ee = {}
        for expID, v in r["data"].iteritems():
            expID = expID.upper()
            ee[expID] = {
                "color" : "#880000",
                "displayName" : ri[expID]["btn"],
                "items" : [{"tissue": ri[expID]["bs"],
                            "cellType": ri[expID]["btn"],
                            "rep": 1,
                            "counts" : v,
                            "expID": expID}],
                "name" : expID }

        ret["items"]["all"] = ee
        return ret

    def get(self, coord):
        rampage = self.pgSearch.rampage(coord)
        if not rampage:
            return rampage

        ri = self.pgSearch.rampage_info()
        ret = []
        for r in rampage:
            ret.append(self._procees(ri, r))
        return ret
