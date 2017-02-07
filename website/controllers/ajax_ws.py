#!/usr/bin/env python

from __future__ import print_function

class AjaxWebServiceOld:
    def _run_venn_queries(self, j, basequery):
        if len(j["cell_types"]) < 2:
            return {"rank_range": [],
                    "totals": {},
                    "overlaps": {} }

        fields = {}
        query = { "aggs": {},
                  "query": self._combine(basequery) }

        # first pass: build rank aggs, cell type aggs
        for cell_type in j["cell_types"]:
            fields[cell_type] = self._get_rankfield(j["rank_type"], cell_type)
            query["aggs"][cell_type + "min"] = {"min": {"field": fields[cell_type]}}
            query["aggs"][cell_type + "max"] = {"max": {"field": fields[cell_type]}}
            query["aggs"][cell_type] = {"filter": {"range": {fields[cell_type]: {"lte": j["rank_threshold"]}}},
                                        "aggs": {} }

        # second pass: build comparison aggs
        for cell_type in j["cell_types"]:
            for comparison_ct in j["cell_types"]:
                if cell_type == comparison_ct: continue
                query["aggs"][cell_type]["aggs"][comparison_ct] = {"range": {"field": fields[comparison_ct],
                                                                             "ranges": [{"to": j["rank_threshold"]}]}}


        # do search
        raw_results = self.es.search(body = query, index = paths.reJsonIndex(self.assembly))["aggregations"]
        rank_range = [min([raw_results[cell_type + "min"]["value"] for cell_type in j["cell_types"]]),
                      max([raw_results[cell_type + "max"]["value"] for cell_type in j["cell_types"]]) ]
        totals = {cell_type: raw_results[cell_type]["doc_count"] for cell_type in j["cell_types"]}

        # only two cell types: format as a venn diagram
        if len(j["cell_types"]) == 2:
            return {"rank_range": rank_range, "collabels": [], "rowlabels": [], "matrix": [],
                    "totals": totals,
                    "overlaps": {ct: {cct: raw_results[ct][cct]["buckets"][0]["doc_count"]
                                      for cct in j["cell_types"] if cct != ct } for ct in j["cell_types"] } }

        # more than two cell types: format as a heatmap
        matrix = []
        for ct1 in j["cell_types"]:
            matrix.append([])
            for ct2 in j["cell_types"]:
                if ct1 == ct2:
                    matrix[-1].append(1)
                elif raw_results[ct1]["doc_count"] + raw_results[ct2]["doc_count"] == 0:
                    matrix[-1].append(0)
                else:
                    matrix[-1].append(raw_results[ct1][ct2]["buckets"][0]["doc_count"] / float(raw_results[ct1]["doc_count"] + raw_results[ct2]["doc_count"]))
        try:
            if len(matrix) != len(matrix[0]):
                raise Exception("heatmap not square: " + str(len(matrix)) + " vs " + str(len(matrix[0])))
            _heatmap = Heatmap(matrix)
        except:
            raise
        roworder, colorder = _heatmap.cluster_by_both()
        roworder, rowtree = roworder
        colorder, coltree = colorder
        return {"rank_range": rank_range, "totals": [], "overlaps": {},
                "totals": totals,
                "rowlabels": [j["cell_types"][x] for x in roworder],
                "collabels": [j["cell_types"][x] for x in colorder],
                "matrix": matrix }

    def _venn_ct_results(self, basequery, cellTypes, ranktype, threshold, limit = 100):
        ret = {}

        cellTypes = filter(lambda x: x, cellTypes)
        if 2 != len(cellTypes):
            return ret

        # build query for individual result sets
        ctqs = []
        for ct in cellTypes:
            field = self._get_rankfield(ranktype, ct)
            ctqs.append(({"range": {field: {"lte": threshold}}},
                         {"range": {field: {"gte": threshold}}}))

        # get overlapping results
        q = {"query": {"bool": {"must": basequery}},
             "size": limit}
        q["query"]["bool"]["must"] += [ctqs[0][0], ctqs[1][0]]
        ret["both cell types"] = self._search({"object": q, "post_processing": {}})

        # results for each cell type individually
        q["query"]["bool"]["must"] = q["query"]["bool"]["must"][:-2] + [ctqs[0][1], ctqs[1][0]]
        ret[cellTypes[1] + " only"] = self._search({"object": q, "post_processing": {}})
        q["query"]["bool"]["must"] = q["query"]["bool"]["must"][:-2] + [ctqs[0][0], ctqs[1][1]]
        ret[cellTypes[0] + " only"] = self._search({"object": q, "post_processing": {}})

        return ret

    def _venn_search(self, j):
        j["post_processing"] = {}

        cts = self._filterCellTypes(j["table_cell_types"])
        if 2 != len(cts):
            return {}

        ret = {"results": self._search(j),
               "sep_results": {}}

        # for drawing the venn or heatmap
        ret["results"]["venn"] = self._run_venn_queries(j["venn"], j["object"])
        # for results tables
        ret["sep_results"] = self._venn_ct_results(j["object"]["query"]["bool"]["filter"],
                                                       j["table_cell_types"], j["venn"]["rank_type"],
                                                       j["venn"]["rank_threshold"])

        return ret

    def _venn_chr(self, j):
        cts = self._filterCellTypes(j["table_cell_types"])

        ret = {"sep_results": {},
               "fold_changes": {}}

        if 2 != len(cts):
            return ret;

        ret["sep_results"] = self._venn_ct_results([], cts, "DNase", 5000, 500)
        ret["fold_changes"] = self.cg.computeFoldChange(cts[0], cts[1])

        for chrom, band in self.cytobands.bands.iteritems():
            ret[chrom] = {"cytobands": band}
        return ret

