from tissue_colors import TissueColors

class Rampage:
    def __init__(self, assembly, pgSearch):
        self.assembly = assembly
        self.pgSearch = pgSearch

    def groupByTissue(self, rows):
        sorter = lambda x: x["tissue"]
        rows.sort(key = sorter)

        ret = {}
        for row in rows:
            t = row["tissue"]
	    if t not in ret:
                c = self.getTissueColor(t)
	        ret[t] = {"name" : t,
                          "displayName" : t,
                          "color": c,
                          "items": []}
            ret[t]["items"].append(row)
        return ret

    def _makeRows(self, rows):
        pass

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
                "displayName" : ri[expID]["tissue"],
                "items" : [{"tissue": ri[expID]["tissue"],
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

    def getByGene(self, gene):
        ensemblid_ver = gene["ensemblid_ver"]
        rampage = self.pgSearch.rampageByGene(ensemblid_ver)
        if not rampage:
            return None

        ri = self.pgSearch.rampage_info()
        ret = {}
        for idx, r in enumerate(rampage):
            tss, info = self._procees(ri, r, idx)
            ret[tss] = info
        return ret


