from __future__ import print_function

import os, sys, json
from collections import defaultdict

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from db_utils import getcursor
from utils import Timer

class RegElementDetails:
    def __init__(self, es, ps, assembly, cache):
        self.index = paths.reJsonIndex(assembly)
        self.es = es
        self.ps = ps
        self.cache = cache
        self.assembly = assembly
        
    def mostsimilar(self, acc, assay, threshold=20000):
        acc = acc.replace("EE", "")
        def whereclause(r):
            return " or ".join(["%s_rank[%d] < %d" % (assay, i + 1, threshold) for i in xrange(len(r)) if r[i] < threshold])
        with getcursor(self.ps.DBCONN, "regelm_detail$RegElementDetails::testmostsimilar") as curs:
            curs.execute("""SELECT {assay}_rank FROM {assembly}_cre
                            WHERE accession LIKE 'E%E{accession}'""".format(assay=assay, assembly=self.assembly, accession=acc))
            r = curs.fetchone()[0]
            if not r:
                print("regelmdetail$RegElementDetails::mostsimilar WARNING: no results for accession %s; returning empty set" % acc)
                return []
            whereclause = whereclause(r)
            if len(whereclause.split(" or ")) > 25:
                print("regelmdetails$RegElementDetails::mostsimilar NOTICE: %s is active in too many cell types (%d); returning empty set" % (acc, len(whereclause.split(" or "))))
                return []
            if not whereclause:
                print("regelmdetails$RegElementDetails::mostsimilar NOTICE: %s not active in any cell types; returning empty set" % acc)
                return []
            curs.execute("""SELECT accession, intarraysimilarity(%(r)s, {assay}_rank, {threshold}) AS similarity, chrom, start, stop FROM {assembly}_cre
                            WHERE {whereclause}
                            ORDER BY similarity DESC LIMIT 20""".format(assay=assay, assembly=self.assembly,
                                                                        threshold=threshold, whereclause=whereclause), {"r": r})
            rr = curs.fetchall()
        return [{"accession": r[0], "position": {"chrom": r[2], "start": r[3], "end": r[4]}} for r in rr]
        
    def reFull(self, reAccession, similarity_assay = "dnase"):
        q = { "query" :{
                  "bool" : {
                      "must" : [
                          {"match" : { "accession" : reAccession } }
                      ]
                  }
            }
        }
        retval = self.es.search(index = self.index, body = q)
        if "hits" not in retval or retval["hits"]["total"] == 0:
            return { "error" : "no hits for " + reAccession}
        if retval["hits"]["total"] > 1:
            #return { "error" : "too many hits (%d) for " + reAccession }
            print("ERROR: too many hits for " + reAccession)
        result = retval["hits"]["hits"][0]["_source"]
        allgenes = result["genes"]["nearest-all"] + result["genes"]["nearest-pc"]
        with Timer("most similar"):
            result["most_similar"] = self.mostsimilar(reAccession, similarity_assay)
        result["nearby_genes"] = [{"name": x["gene-name"],
                                   "distance": x["distance"] } for x in allgenes]
        return result

    def _get_overlap_message(self, overlap_fraction, overlap_bp):
        if overlap_fraction > 0.0:
            return "(overlap at least %f%)" % (overlap_fraction * 100.0)
        if overlap_bp > 1:
            return "(overlap at least %d bp)" % overlap_bp
        return "(any overlap)"
    
    def get_intersecting_beds(self, reAccession,
                              overlap_fraction = 0.0, overlap_bp = 0):
        re = self.reFull(reAccession)
        if "error" in re:
            return re
        pos = re["position"]
        if overlap_fraction > 1.0:
            overlap_fraction = 1.0
        exps = self.ps.findBedOverlapAllAssays(re["genome"],
                                               pos["chrom"],
                                               pos["start"],
                                               pos["end"],
                                               overlap_fraction = overlap_fraction,
                                               overlap_bp = overlap_bp )
        print(re["genome"],
              pos["chrom"],
              pos["start"],
              pos["end"],
              self._get_overlap_message(overlap_fraction, overlap_bp))
        print("found", len(exps), "overlapping peak exps")
        return {"experiments": exps}

    def _processResultJS(self, _results, qcoord, name_field):
        results = []
        for result in _results["hits"]["hits"]:
            result = result["_source"]
            coord = result["position"]
            distance = min(abs(int(coord["end"]) - qcoord["end"]),
                           abs(int(coord["start"]) - qcoord["start"]))
            results.append({"name": result[name_field],
                            "distance": distance})
        return results
    
    def formatSnpsJS(self, snp_results, qcoord):
        return self._processResultJS(snp_results, qcoord, "accession")

    def formatResJS(self, snp_results, qcoord, name = ""):
        ret = self._processResultJS(snp_results, qcoord, "accession")
        # exclude RE being queried
        ret = filter(lambda x: x["name"] != name, ret)
        return ret

    def formatGenesJS(self, gene_results, qcoord):
        return self._processResultJS(gene_results, qcoord, "approved_symbol")
    
    def get_bed_stats(self, bed_accs):
        r = self.es.get_bed_list(bed_accs)
        hits = r["hits"]

        foundIDs = [x["_source"]["accession"] for x in hits["hits"]]

        if hits["total"] != len(bed_accs):
            for fid in bed_accs:
                if fid not in foundIDs:
                    print("WARNING: postgres BED match %s is not indexed in ElasticSearch" % fid)

        results = {"tfs": defaultdict(lambda : defaultdict(int)),
                   "histones": defaultdict(lambda : defaultdict(int)),
                   "other": defaultdict(lambda : defaultdict(int)) }
        
        for _hit in hits["hits"]:
            hit = _hit["_source"]
            cell_line = hit["biosample_term_name"]
            label = hit["label"]
            if "" == label.strip():
                label = hit["assay_term_name"]
                results["other"][cell_line][label] += 1
            elif "transcription" in hit["target"]:
                results["tfs"][cell_line][label] += 1
            elif "histone" in hit["target"]:
                results["histones"][cell_line][label] += 1
            else:
                print("WARNING: experiment with assay %s does not seem to fit into existing categories" % hit["assay_term_name"])

        formatted_results = {"tfs": [],
                             "histones": [],
                             "other": [] }

        for key, resultslist in results.iteritems():
            for cell_line, result in resultslist.iteritems():
                formatted_results[key].append({"id": cell_line,
                                               "total": 0,
                                               "labels": []})
                for label, val in result.iteritems():
                    formatted_results[key][-1]["labels"].append({"id": label,
                                                                 "count": val})
                    formatted_results[key][-1]["total"] += val
        return formatted_results

def main():
    from elasticsearch import Elasticsearch
    from elastic_search_wrapper import ElasticSearchWrapper
    import gzip
    
    es = ElasticSearchWrapper(Elasticsearch())
    red = RegElementDetails(es, None)
    with gzip.open("/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/candidate-re-links.json.gz") as f:
        for line in f:
            c = json.loads(line)
            acc = c["candidate-re"]
            re = red.reFull(acc)
            if "position" in re:
                pos = re["position"]
                print(acc, pos["chrom"], pos["start"], pos["end"])
            else:
                print("could not parse", acc)
            
if __name__ == '__main__':
    main()
