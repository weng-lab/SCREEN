class Trees:
    def __init__(self, cache, pg, assembly, tree_rank_method):
        self.cache = cache
        self.pg = pg
        self.assembly = assembly
        self.tree_rank_method = tree_rank_method

    def getTree(self):
        results = {}
        biosampleTypes = self.cache.biosampleTypes
        for typ in biosampleTypes:
            def ctFilter(ct):
                if not ct in self.cache.biosamples:
                    print("missing", ct)
                    return False
                return typ == self.cache.biosamples[ct].biosample_type

            c = Correlation(_ret["hits"]["hits"], self.ps.DBCONN)
            k = "dnase" if j["inner"] is None else j["inner"].lower()

            with Timer(typ + ": spearman correlation time"):
                if self.assembly == "hg19":
                    labels, corr = c.spearmanr(j.get("outer", "dnase"),
                                               j.get("inner", None),
                                               ctFilter )
                else:
                    labels = self.cache.celltypemap[k]
                    labels, corr = c.dbcorr(self.assembly, k, labels, lambda x: "bryo" in x)
                    print("!got correlation")

            if not labels:
                continue
            rho = corr[0] if len(corr) == 2 else corr

            try:
                rhoList = rho.tolist() if type(rho) is not list else rho
                _heatmap = Heatmap(rhoList)
            except:
                print("rho", rho)
                print("pval", pval)
                continue
            with Timer(typ + ": hierarchical clustering time"):
                roworder, rowtree = _heatmap.cluster_by_rows()
            results[typ] = {"tree": rowtree, "labels": labels}

        title = ' / '.join([x for x in
                             [j.get("outer", "dnase"), j.get("inner", None)]
                             if x])
        return {"results": {"tree": results,
                            "tree_title" : title }}
