from tissue_colors import TissueColors

class HelperGrouper:
    def __init__(self, rows):
        self.tissueColors = TissueColors()
        self.rows = rows
        self.byID = {r["id"] : r for r in self.rows}

        for rid, r in self.byID.iteritems():
            r["color"] = self.tissueColors.getTissueColor(r["tissue"])

    def getGroupedItems(self, skey):
        return { "byTissue" : self.groupByTissue(skey),
                 "byTissueMax" : self.groupByTissueMax(skey),
                 "byValue" : self.sortByExpression(skey)}

    def groupByTissue(self, skey):
        sorter = lambda x: x["tissue"]
        self.rows.sort(key = sorter)

        ret = {}
        for row in self.rows:
            t = row["tissue"]
	    if t not in ret:
                c = row["color"]
	        ret[t] = {"name" : t,
                          "displayName" : t,
                          "color": c,
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
                c = row["color"]
	        ret[t] = {"name" : t,
                          "displayName" : t,
                          "color": c,
                          "items": [row["id"]]}
            else:
                if self.byID[ret[t]["items"][0]][skey] < row[skey]:
                    ret[t]["items"] = [row["id"]]

        rows = ret.values()
        sorter = lambda rid: self.byID[rid["items"][0]][skey]
        rows.sort(key = sorter, reverse = True)

        ret = {}
        for idx, row in enumerate(rows):
            t = row["name"]
            k = str(idx).zfill(3) + '_' + t
	    ret[k] = row
        return ret

    def sortByExpression(self, skey):
        sorter = lambda x: x[skey]
        self.rows.sort(key = sorter, reverse = True)

        ret = {}
        for idx, row in enumerate(self.rows):
            t = row["tissue"]
            c = row["color"]
            k = str(idx).zfill(3) + '_' + t
	    ret[k] = {"name" : k,
                      "displayName" : t,
                      "color": c,
                      "items": [row["id"]]}
        return ret

