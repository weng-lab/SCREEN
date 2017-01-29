#!/usr/bin/env python

import sys
import os
import argparse
import gzip

class ExtractRawPeaks:
    def __init__(self, assembly):
        self.assembly = assembly
        self.d = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9"
        self.d = os.path.join(self.d, assembly)
        self.bwtool = "/data/cherrypy/bin/bwtool"
        if not os.path.exists(self.bwtool):
            self.bwtool = "/usr/local/bin/bwtool"

    def run(self):
        self.writeBed()
            
    def _runBw(self, bed, fnp):
        return subprocess.check_output(
            [self.bwtool, "extract", "bed",
             bed, fnp, "/dev/stdout"]).split("\n")

    def writeBed(self):
        inFnp = os.path.join(self.d, "raw", "masterPeaks.bed.gz")
        outFnp = os.path.join(self.d, "raw", "miniPeakSites.bed.gz")

        with gzip.open(inFnp) as inF:
            with gzip.open(outFnp, "wb") as outF:
                for line in inF:
                    toks = line.rstrip().split('\t')
                    chrom = toks[0]
                    start = int(toks[1])
                    stop = int(toks[2])
                    accession = toks[4]
                    padding = (1000 - (stop - start)) / 2.0
                    outF.write('\t'.join([str(x) for x in
                                          [chrom,
                                           max(0, start - padding),
                                           stop + padding,
                                           accession]]) + '\n')
        print("wrote", outFnp)
                
    def _doGetAvgSignals(self, accessionsToGet, bigWigs, cache, n_bars):
        d = "/project/umw_zhiping_weng/0_metadata/encode/data"
        bfnps = []
        for bw in bigWigs:
            fnp = os.path.join(d, bw["accession"], bw["bigwig"] + ".bigWig")
            if os.path.exists(fnp):
                bfnps.append({"fnp": fnp, "ct": bw["ct"]})
            else:
                print("WARNING: missing bigwig", fnp)

        bedFnp = self.getfile()
        with open(bedFnp, "w") as o:
            for c in accessionsToGet:
                padding = (1000 - (c["end"] - c["start"])) / 2
                accession = c["accession"]
                o.write("%s\t%d\t%d\t%s\n" %
                        (c["chrom"],
                         max(0, c["start"] - padding),
                         c["end"] + padding,
                         accession))
        for bw in bfnps:
            signals = self._runBw(bedFnp, bw["fnp"])
            ct = bw["ct"]
            for line in signals:
                p = line.split("\t")
                if len(p) >= 6:
                    accession = p[3]
                    avgSignal = self._condense_regions(p[5].split(","), n_bars)
                    cache[accession][ct] = avgSignal
        os.remove(bedFnp)
        return cache

    def getregions(self, cres, bigWigs, n_bars):
        cache = {k["accession"]: {} for k in cres}
#        cache = self.minipeaks_cache.getVec([c["accession"] for c in cres])
        _accessionsToGet = {c["accession"]: c for c in cres}

        for acc, ctAndAvgSignals in cache.iteritems():
            if ctAndAvgSignals:
                _accessionsToGet.pop(acc, None)
        accessionsToGet = [c for k, c in _accessionsToGet.iteritems()]

        if accessionsToGet:
            cache = self._doGetAvgSignals(accessionsToGet, bigWigs, cache, n_bars)
#            self.minipeaks_cache.insertVec(cache)

        ret = {}
        for bw in bigWigs:
            ct = bw["ct"]
            ret[ct] = {"tissue": bw["tissue"]}
            for c in cres:
                accession = c["accession"]
                if accession not in cache or ct not in cache[accession]:
                    #print("bigwig$BigWig::getregions WARNING: missing ct %s for accession %s" % (ct, accession))
                    ret[ct][accession] = []
                else:
                    ret[ct][accession] = cache[accession][ct]
        return ret

    def _condense_regions(self, regions, n):
        regions = [float(x) if x != "NA" else 0.0 for x in regions]
        l = len(regions) / n
        results = []
        for i in xrange(n):
            results.append(round(sum(regions[l * i : l * (i + 1)]) / l, 2))
        return results

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--list', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="mm10")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    ep = ExtractRawPeaks(args.assembly)
    ep.run()

    return 0

if __name__ == '__main__':
    sys.exit(main())
