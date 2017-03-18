from collections import OrderedDict

from tissue_colors import TissueColors

class HelperGrouper:
    def __init__(self, cache, transcript, rows):
        self.transcript = transcript
        self.rows = rows

        self.tissueColors = TissueColors(cache)
        self.byID = {r["id"] : r for r in self.rows}

        for rid, r in self.byID.iteritems():
            r["color"] = self.tissueColors.getTissueColor(r["tissue"])
            r["counts"] = float(r["counts"])

    def getGroupedItems(self, skey):
        return { "byTissue" : self.groupByTissue(skey),
                 "byTissueMax" : self.groupByTissueMax(skey),
                 "byValue" : self.sortByValue(skey)}

    def groupByTissue(self, skey):
        sorter = lambda x: x["tissue"]
        self.rows.sort(key = sorter)

        ret = {}
        for row in self.rows:
            t = row["tissue"]
	    if t not in ret:
	        ret[t] = {"tissue" : t,
                          "color": row["color"],
                          "items": []}
            ret[t]["items"].append(row["id"])

        for k, v in ret.iteritems():
            sorter = lambda rid: (self.byID[rid][skey], self.byID[rid]["tissue"])
            ret[k]["items"].sort(key = sorter, reverse = True)
        return ret

    def groupByTissueMax(self, skey):
        sorter = lambda x: x["tissue"]
        self.rows.sort(key = sorter)

        ret = {}
        for row in self.rows:
            t = row["tissue"]
	    if t not in ret:
	        ret[t] = {"tissue" : t,
                          "color": row["color"],
                          "items": [row["id"]]}
            else:
                if self.byID[ret[t]["items"][0]][skey] < row[skey]:
                    ret[t]["items"] = [row["id"]]

        rows = ret.values()
        sorter = lambda rid: self.byID[rid["items"][0]][skey]
        rows.sort(key = sorter, reverse = True)

        ret = {}
        for idx, row in enumerate(rows):
            t = row["tissue"]
            k = str(idx).zfill(3) + '_' + t
	    ret[k] = row
        return ret

    def sortByValue(self, skey):
        sorter = lambda x: x[skey]
        self.rows.sort(key = sorter, reverse = True)

        ret = OrderedDict()
        for idx, row in enumerate(self.rows):
            t = row["tissue"]
            k = str(idx).zfill(3) + '_' + t
	    ret[k] = {"tissue" : t,
                      "color": row["color"],
                      "items": [row["id"]]}
        return ret

