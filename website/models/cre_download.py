#!/usr/bin/env python

from __future__ import print_function

import os

class CREdownload:
    def __init__(self, pgSearch, cache):
        self.pgSearch = pgSearch
        self.cache = cache


    def bed(self, j, uid):
        try:
            ret = self.downloadAsBed(j, uid)
            return ret
        except:
            raise
            return { "error" : "error running action"}

    def json(self, j, uid):
        try:
            ret = self.downloadAsJson(j, uid)
            return ret
        except:
            raise
            return { "error" : "error running action"}

    def downloadFileName(self, uid, formt):
        timestr = time.strftime("%Y%m%d-%H%M%S")
        outFn = '-'.join([timestr, "v4", formt]) + ".zip"
        outFnp = os.path.join(self.staticDir, "downloads", uid, outFn)
        Utils.ensureDir(outFnp)
        return outFn, outFnp

    def downloadAsSomething(self, uid, j, formt, writeFunc):
        ret = self._query({"object": j["object"],
                           "index": paths.reJsonIndex(self.assembly),
                           "callback": "regulatory_elements" })
        outFn, outFnp = self.downloadFileName(uid, formt)

        data = writeFunc(ret["results"]["hits"])

        with open(outFnp, mode='w') as f:
            f.write(data)

        print("wrote", outFnp)

        url = os.path.join('/', "static", "downloads", uid, outFn)
        return {"url" : url}

    def downloadAsBed(self, j, uid):
        rankTypes = {"ctcf" : ["CTCF-Only", "DNase+CTCF"],
                     "dnase": [],
                     "enhancer": ["DNase+H3K27ac", "H3K27ac-Only"],
                     "promoter": ["DNase+H3K4me3", "H3K4me3-Only"]}

        def writeBedLine(rank, subRank, ct, cre):
            re = cre["_source"]
            pos = re["position"]
            if "dnase" == rank:
                r = re["ranks"][rank][ct]
                signal = r["signal"]
            else:
                if subRank in re["ranks"][rank][ct]:
                    r = re["ranks"][rank][ct][subRank]
                    signalKeys = [x for x in r.keys() if x != "rank"]
                    signalValues = [r[x]["signal"] for x in signalKeys]
                    signal = np.mean(signalValues)
                else:
                    return None
            rankVal = r["rank"]
            signal = round(signal, 2)

            score = int(Utils.scale(rankVal, (1, 250 * 100), (1000, 1)))
            toks = [pos["chrom"], pos["start"], pos["end"], re["accession"],
                    score, '.', signal, re["neg-log-p"], -1, -1]
            return "\t".join([str(x) for x in toks])

        def writeBed(rank, subRank, ct, rows):
            f = StringIO.StringIO()
            for re in rows:
                line = writeBedLine(rank, subRank, ct, re)
                if not line:
                    return None
                f.write(line  + "\n")
            return f.getvalue()

        def writeBeds(rows):
            mf = StringIO.StringIO()
            with zipfile.ZipFile(mf, mode='w',
                                 compression=zipfile.ZIP_DEFLATED) as zf:
                for rank, subRanks in rankTypes.iteritems():
                    cts = rows[0]["_source"]["ranks"][rank].keys()
                    if "dnase" == rank:
                        for ct in cts:
                            data = writeBed(rank, [], ct, rows)
                            ct = Utils.sanitize(ct)
                            fn = '.'.join([rank, ct, "bed"])
                            if data:
                                zf.writestr(fn, data)
                    else:
                        for subRank in subRanks:
                            for ct in cts:
                                data = writeBed(rank, subRank, ct, rows)
                                ct = Utils.sanitize(ct)
                                fn = '.'.join([rank, subRank, ct, "bed"])
                                if data:
                                    zf.writestr(fn, data)
            return mf.getvalue()
        return self.downloadAsSomething(uid, j, "beds", writeBeds)

    def downloadAsJson(self, j, uid):
        def writeJson(rows):
            mf = StringIO.StringIO()
            with zipfile.ZipFile(mf, mode='w',
                                 compression=zipfile.ZIP_DEFLATED) as zf:
                for cre in rows:
                    re = cre["_source"]
                    data = json.dumps(re) + "\n"
                    zf.writestr(re["accession"] + '.json', data)
            return mf.getvalue()
        return self.downloadAsSomething(uid, j, "jsons", writeJson)
