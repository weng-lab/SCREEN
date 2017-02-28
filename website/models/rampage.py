class Rampage:
    def __init__(self, assembly, pgSearch):
        self.assembly = assembly
        self.pgSearch = pgSearch

    def _procees(self, ri, r, idx):
        ret = {}
        ret["gene"] = r["ensemblid_ver"]
        ret["tss"] = r["tss"]
        ret["tss_sane"] = r["tss"].replace(".", "").replace("_", "")
        ret["tab_active"] = ""
        if 0 == idx:
            ret["tab_active"] = "active"

        ret["chrom"] = r["chrom"]
        ret["start"] = r["start"]
        ret["stop"] = r["stop"]

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

        ret["items"] = {}
        ret["items"]["all"] = ee
        return r["tss"], ret

    def get(self, coord):
        rampage = self.pgSearch.rampage(coord)
        if not rampage:
            return None

        ri = self.pgSearch.rampage_info()
        ret = {}
        for idx, r in enumerate(rampage):
            tss, info = self._procees(ri, r, idx)
            ret[tss] = info
        return ret
