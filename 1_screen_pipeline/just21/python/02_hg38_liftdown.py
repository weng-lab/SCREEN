from __future__ import print_function

import sys
import os

import gzip
import subprocess
import json
from pyliftover import LiftOver


class WLiftOver:

    @staticmethod
    def _validate(chrom, original, liftedover):

        # sanity checks
        if not liftedover[0] or not liftedover[1]:
            return None  # no match in new assembly
        start = liftedover[0][0]
        end = liftedover[1][0]
        if start[0] != chrom or end[0] != chrom:
            return None  # mismatched chromosome

        # length checks
        origlen = original[1] - original[0]
        newlen = end[1] - start[1]
        if origlen < 0 or newlen < 0:
            return None  # negative length
        if abs(origlen - newlen) > 5000:
            return None  # excessive length change

        # new region OK
        return (start[1], end[1])

    def __init__(self, origin, target):
        self.liftover = LiftOver(origin, target)

    def liftOverRegion(self, chrom, region):
        nregion = (self.liftover.convert_coordinate(chrom, region[0]),
                   self.liftover.convert_coordinate(chrom, region[1]))
        return WLiftOver._validate(chrom, region, nregion)

    def liftOverRegions(self, regions):
        return filter(lambda region: region is not None,
                      [self.liftOverRegion(region) for region in regions])

    def liftOverBed(self, input_path, output_path):
        _iopen = gzip.open if input_path.endswith(".gz") else open
        _oopen = gzip.open if output_path.endswith(".gz") else open
        with _iopen(input_path, 'r') as f:
            with _oopen(output_path, 'wb') as o:
                for line in f:
                    p = line.strip().split('\t')
                    nregion = self.liftOverRegion(p[0], (int(p[1]), int(p[2])))
                    if nregion:
                        o.write("%s\t%d\t%d\t%s\n" % (p[0], nregion[0], nregion[1], '\t'.join(p[3:])))


class Intersect:
    def __init__(self, a, b):
        self.a = a
        self.b = b
        self.total = 0
        self.filteredZTotal = [0, 0, 0, 0]
        with open(a, "r") as f:
            for line in f:
                self.total += 1
                line = line.strip().split('\t')
                for i in range(4, 8):
                    if i >= len(line):
                        continue
                    if float(line[i]) > 1.64:
                        self.filteredZTotal[i - 4] += 1

    def _intersected_regions(self, fraction):
        if fraction > 1.0:
            fraction = 1.0
        cmd = ["bedtools", "intersect"]
        if fraction > 0.0:
            cmd += ["-f", str(fraction)]
        return list(set(subprocess.check_output(cmd + ["-a", self.a, "-b", self.b, "-wa"]).split('\n')))

    def _intersect(self, fraction):
        intersected = len(self._intersected_regions(fraction))
        return float(intersected) / self.total

    def intersectRange(self, n_intervals):
        results = []
        for i in xrange(n_intervals):
            print("02_hg38_liftdown$Intersect::intersectRange: %s: %d / %d"
                  % (self.a, i, n_intervals))
            results.append(self._intersect(float(i) / n_intervals))
        return results

    def intersectRangeWithZ(self, n_intervals):
        results = []
        ZResults = [[], [], [], []]
        for i in xrange(n_intervals):
            print("02_hg38_liftdown$Intersect::intersectRange: %s: %d / %d"
                  % (self.a, i, n_intervals))

            # get regions, append fraction of total
            regions = self._intersected_regions(float(i) / n_intervals)
            results.append(float(len(regions)) / self.total)

            # filter at 1.64 for each mark individually, and add those fractions
            ztotals = [0, 0, 0, 0]
            for region in regions:
                region = region.strip().split('\t')
                if len(region) < 8:
                    continue
                for j in range(4, 8):
                    if float(region[j]) > 1.64:
                        ztotals[j - 4] += 1
            for j in xrange(len(ztotals)):
                ZResults[j].append(float(ztotals[j]) / self.filteredZTotal[j])

        return (results, ZResults)


def _writeIntersection(a, b, path, n_intervals):
    results, zresults = Intersect(a, b).intersectRangeWithZ(n_intervals)
    with open(path, "wb") as o:
        o.write(json.dumps({
            "all": results,
            "DNase": zresults[0],
            "H3K4me3": zresults[1],
            "H3K27ac": zresults[2],
            "CTCF": zresults[3]
        }) + '\n')


def _writeIntersectionNoZ(a, b, path, n_intervals):
    results = Intersect(a, b).intersectRange(n_intervals)
    with open(path, "wb") as o:
        o.write(json.dumps(results))


def main():

    # hg38 to hg19
    """
    to19 = WLiftOver("hg38", "hg19")
    to19.liftOverBed("/data/projects/cREs/hg38/rDHS.bed",
                     "/data/projects/cREs/hg38/rDHS.hg19.liftOver.bed")
    print("wrote /data/projects/cREs/hg38/rDHS.hg19.liftOver.bed")
    to19.liftOverBed("/data/projects/cREs/hg38/CTA.bed",
                     "/data/projects/cREs/hg38/CTA.hg19.liftOver.bed")
    print("wrote /data/projects/cREs/hg38/CTA.hg19.liftOver.bed")

    # hg19 to hg38
    to19 = WLiftOver("hg19", "hg38")
    to19.liftOverBed("/data/projects/cREs/hg19/rDHS.bed",
                     "/data/projects/cREs/hg19/rDHS.hg38.liftOver.bed")
    print("wrote /data/projects/cREs/hg19/rDHS.hg38.liftOver.bed")
    to19.liftOverBed("/data/projects/cREs/hg19/CTA.bed",
                     "/data/projects/cREs/hg19/CTA.hg38.liftOver.bed")
    print("wrote /data/projects/cREs/hg19/CTA.hg38.liftOver.bed")

    # intersect pairs
    _writeIntersection("/data/projects/cREs/hg19/CTA.bed", "/data/projects/cREs/hg38/CTA.hg19.liftOver.bed",
                       "/data/projects/cREs/hg19/CTA.hg19.intersected.json", 20) # fraction of original hg19 cREs overlapping
    _writeIntersection("/data/projects/cREs/hg38/CTA.bed", "/data/projects/cREs/hg19/CTA.hg38.liftOver.bed",
                       "/data/projects/cREs/hg38/CTA.hg38.intersected.json", 20) # fraction of original hg38 cREs overlapping
    _writeIntersection("/data/projects/cREs/hg38/CTA.hg19.liftOver.bed", "/data/projects/cREs/hg19/CTA.bed",
                       "/data/projects/cREs/hg38/CTA.hg19.intersected.json", 20) # fraction of lifted down cREs overlapping
    _writeIntersection("/data/projects/cREs/hg19/CTA.hg38.liftOver.bed", "/data/projects/cREs/hg38/CTA.bed",
                       "/data/projects/cREs/hg19/CTA.hg38.intersected.json", 20) # fraction of lifted up cREs overlapping
    """

    # do Cistrome intersection with hg19
    _writeIntersectionNoZ("/data/projects/cREs/hg19/CTA.hg38.liftOver.bed", "/data/projects/cREs/hg38/rDHS.encode+cistrome.bed",
                          "/data/projects/cREs/hg38/CTA.hg19.cistromeintersected.json", 20)  # fraction of lifted over hg19 cREs overlapping
    _writeIntersectionNoZ("/data/projects/cREs/hg38/rDHS.encode+cistrome.bed", "/data/projects/cREs/hg19/CTA.hg38.liftOver.bed",
                          "/data/projects/cREs/hg38/CTA.hg38.cistromeintersected.json", 20)  # fraction of Cistrome+ENCODE cREs overlapping

    return 0


if __name__ == "__main__":
    sys.exit(main())
