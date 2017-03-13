from natsort import natsorted

from tissue_colors import TissueColors

class Rampage:
    def __init__(self, assembly, pgSearch):
        self.assembly = assembly
        self.pgSearch = pgSearch
        self.tissueColors = TissueColors()

    def getTissueColor(self, t):
        return self.tissueColors.getTissueColor(t)

    def _groupByTissue(self, rows):
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

    def _groupByTissueMax(self, rows, key):
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
                          "items": [row]}
            else:
                if ret[t]["items"][0][key] < row[key]:
                    ret[t]["items"][0] = row

        rows = ret.values()
        sorter = lambda x: x["items"][0][key]
        rows.sort(key = sorter, reverse = True)
        return rows

    def _sortByExpression(self, rows, key):
        sorter = lambda x: float(x[key])
        rows.sort(key = sorter, reverse = True)

        ret = {}
        for idx, row in enumerate(rows):
            t = row["tissue"]
            c = self.getTissueColor(t)
            k = str(idx).zfill(3) + '_' + t
	    ret[k] = {"name" : k,
                      "displayName" : t,
                      "color": c,
                      "items": [row]}
        return ret

    def _procees(self, rows, ri):
        ret = {}
        ret["tss"] = rows["tss"]
        ret["chrom"] = rows["chrom"]
        ret["start"] = rows["start"]
        ret["stop"] = rows["stop"]

        items = []
        for expID, val in rows["data"].iteritems():
            expID = expID.upper()
            items.append({"tissue": ri[expID]["tissue"],
                          "cellType": ri[expID]["btn"],
                          "rep": 1,
                          "counts" : val,
                          "expID": expID})

        ret["items"] = {"byTissue" : self._groupByTissue(items),
                        "byTissueMax" : self._groupByTissueMax(items, "counts"),
                        "byValue" : self._sortByExpression(items, "counts")}
        return ret

    def getByGene(self, gene):
        ensemblid_ver = gene["ensemblid_ver"]
        rows = self.pgSearch.rampageByGene(ensemblid_ver)
        if not rows:
            return {"sortedTranscripts" : [],
                    "tsss" : [],
                    "gene" : ""}

        ri = self.pgSearch.rampage_info()
        byTranscript = {}
        for row in rows:
            info = self._procees(row, ri)
            byTranscript[info["tss"]] = info

        transcripts = natsorted(byTranscript.keys())
        return {"sortedTranscripts" : transcripts,
                "tsss" : byTranscript,
                "gene" : gene}
