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
        print(j)
        return ""


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
