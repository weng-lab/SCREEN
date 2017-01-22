import subprocess
import md5
import time
import sys
import os

class BigWig:

    @staticmethod
    def getfile():
        m = md5.new()
        m.update(str(time.gmtime()))
        return os.path.join("/tmp", m.hexdigest() + ".bed")

    @staticmethod
    def getregions(regions, files, n_bars):
        bed = BigWig.getfile()
        retval = {}
        with open(bed, "wb") as o:
            for region in regions:
                o.write("%s\t%d\t%d\t%s\n" %
                        (region["chr"],
                         region["start"] - 1000, region["end"] + 1000,
                         region["acc"]))
        for bigwig in files:
            if not os.path.exists(bigwig["path"]):
                print("WARNING: missing bigwig %s" % bigwig["path"])
                continue
            retval[bigwig["ct"]] = {}

            bwtool = "/data/cherrypy/bin/bwtool"
            if not os.path.exists(bwtool):
                bwtool = "/usr/local/bin/bwtool"

            results = subprocess.check_output(
                [bwtool, "extract", "bed", bed, bigwig["path"], "/dev/stdout"]).split("\n")
            for line in results:
                p = line.split("\t")
                if len(p) >= 6:
                    retval[bigwig["ct"]][p[3]] = BigWig._condense_regions(p[5].split(","), n_bars)
        subprocess.check_output(["rm", bed])
        return retval

    @staticmethod
    def _condense_regions(regions, n):
        regions = [float(x) if x != "NA" else 0.0 for x in regions]
        l = len(regions) / n
        results = []
        for i in xrange(n):
            results.append(sum(regions[l * i : l * (i + 1)]) / l)
        return results
