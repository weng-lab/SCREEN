class RankHeatmap:

    def __init__(self, TissueMap, rank_types, threshold = 10000):
        self.aggs = {}
        self._rank_types = rank_types
        for v in TissueMap:
            for rank_type in ["Enhancer", "Promoter", "DNase", "CTCF"]:
                k = "rank_%s_%s" % (rank_type, v["tissue"])
                if k not in self.aggs:
                    self.aggs[k] = {"filter": {"bool": {"should": []}}}
                self.aggs[k]["filter"]["bool"]["should"].append(self._rank_filter(rank_type, v["value"], threshold))

    def _rank_filter(self, ranktype, celltype, threshold):
        rt1, rt2 = self._rank_types[ranktype]
        return {"range": {"ranks.%s.%s%s.rank" % (rt1, celltype, rt2): {"lte": threshold}}}

    def process(self, results):
        total = results["hits"]["total"]
        retval = {k.split("_")[2]: {} for k, v in results["aggregations"].iteritems()}
        for k, v in results["aggregations"].iteritems():
            if not k.startswith("rank_"): continue
            rank_type = k.split("_")[1]
            tissue = k.split("_")[2]
            retval[tissue][rank_type] = v["doc_count"] / total
        return retval
