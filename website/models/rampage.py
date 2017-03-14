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
        sorter = lambda x: float(x["items"][0][key])
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

    def _procees(self, trans, ri):
        ret = {}
        ret["transcript"] = trans["transcript"]
        ret["chrom"] = trans["chrom"]
        ret["start"] = trans["start"]
        ret["stop"] = trans["stop"]
        ret["strand"] = trans["strand"]
        ret["geneinfo"] = trans["geneinfo"].replace("_", " ")

        items = []
        for fileID, val in trans["data"].iteritems():
            fileID = fileID.upper()
            info = ri[fileID]
            info["counts"] = round(val, 4)
            items.append(info)

        ret["items"] = {"byTissue" : self._groupByTissue(items),
                        "byTissueMax" : self._groupByTissueMax(items, "counts"),
                        "byValue" : self._sortByExpression(items, "counts")}
        return ret

    def getByGene(self, gene):
        ensemblid_ver = gene["ensemblid_ver"]
        transcripts = self.pgSearch.rampageByGene(ensemblid_ver)
        if not transcripts:
            return {"sortedTranscripts" : [],
                    "tsss" : [],
                    "gene" : ""}

        ri = self.pgSearch.rampage_info()
        byTranscript = {}
        for transcript in transcripts:
            info = self._procees(transcript, ri)
            byTranscript[info["transcript"]] = info

        transcripts = natsorted(byTranscript.keys())
        return {"sortedTranscripts" : transcripts,
                "tsss" : byTranscript,
                "gene" : gene}
