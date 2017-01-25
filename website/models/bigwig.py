import subprocess
import md5
import time
import sys
import os

class BigWig:
    def __init__(self, minipeaks_cache):
        self.minipeaks_cache = minipeaks_cache
        self.bwtool = "/data/cherrypy/bin/bwtool"
        if not os.path.exists(self.bwtool):
            self.bwtool = "/usr/local/bin/bwtool"

    def getfile(self):
        m = md5.new()
        m.update(str(time.gmtime()))
        return os.path.join("/tmp", m.hexdigest() + ".bed")

    def _runBw(self, bed, fnp):
        return subprocess.check_output(
            [self.bwtool, "extract", "bed",
             bed, fnp, "/dev/stdout"]).split("\n")

    def getregions(self, cres, bigWigs, n_bars):
        cache = self.minipeaks_cache.getVec([c["accession"] for c in cres])
        accessionsToGet = []

        for acc, ctAndAvgSignals in cache.iteritems():
            if not ctAndAvgSignals:
                accessionsToGet.append(c)

        if accessionsToGet:
            bedFnp = self.getfile()
            with open(bedFnp, "w") as o:
                for c in accessionsToGet:
                    accession = c["accession"]
                    o.write("%s\t%d\t%d\t%s\n" %
                            (c["chrom"],
                             max(0, c["start"] - 2000),
                             c["end"] + 2000,
                             accession))
            for bw in bigWigs:
                signals = self._runBw(bedFnp, bw["fnp"])
                ct = bw["ct"]
                for line in signals:
                    p = line.split("\t")
                    if len(p) >= 6:
                        accession = p[3]
                        avgSignal = self._condense_regions(p[5].split(","), n_bars)
                        cache[accession][ct] = avgSignal
            os.remove(bedFnp)

        ret = {}
        for bw in bigWigs:
            ct = bw["ct"]
            ret[ct] = {"tissue": bw["tissue"]}
            for c in cres:
                accession = c["accession"]
                ret[ct][accession] = cache[accession][ct]
        if accessionsToGet:
            self.minipeaks_cache.insertVec(cache)
        return ret

    def _condense_regions(self, regions, n):
        regions = [float(x) if x != "NA" else 0.0 for x in regions]
        l = len(regions) / n
        results = []
        for i in xrange(n):
            results.append(round(sum(regions[l * i : l * (i + 1)]) / l, 2))
        return results
