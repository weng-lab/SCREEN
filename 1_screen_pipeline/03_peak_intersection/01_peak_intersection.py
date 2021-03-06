#!/usr/bin/env python2

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function
import arrow
import os
import sys
import ujson as json
import argparse
import fileinput
import StringIO
import gzip
import random

from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt, printWroteNumLines, eprint
from metadataws import MetadataWS
from files_and_paths import Datasets, Dirs
from exp import Exp

AddPath(__file__, '../../common/')
from constants import paths, chroms
from common import printr, printt
from config import Config

def loadJobs(assembly, runDate):
    fnp = paths.path(assembly, "extras", runDate, "jobs.json.gz")

    printt("reading", fnp)
    with gzip.open(fnp) as f:
        jobs = json.load(f)
    printt("loaded", len(jobs))
    return jobs

def getFileJson(exp, bed):
    return {"accession": bed.fileID,
            "dataset_accession": exp.encodeID,
            "biosample_term_name": exp.biosample_term_name,
            "assay_term_name": exp.assay_term_name,
            "target": exp.target,
            "label": exp.label}


def doIntersection(bed, refnp):
    cmds = ["bedtools", "intersect",
            "-a", refnp,
            "-b", bed.fnp(),
            "-wa"]
    try:
        peaks = Utils.runCmds(cmds)
    except:
        printt("failed to run", " ".join(cmds))
        return None

    return [p.rstrip().split("\t")[4] for p in peaks]  # return cRE accessions

def runIntersectJob(jobargs, bedfnp):
    exp = jobargs["exp"]
    bed = jobargs["bed"]
    fileJson = getFileJson(exp, bed)
    label = exp.label if jobargs["etype"] != "dnase" else "dnase"
    if not os.path.exists(bed.fnp()):
        printt("warning: missing bed", bed.fnp(), "-- cannot intersect")
        return (fileJson, None)

    ret = []
    printr("(exp %d of %d)" % (jobargs["i"], jobargs["total"]),
           "intersecting", jobargs["etype"], label)
    accessions = doIntersection(bed, bedfnp)
    if accessions is None:
        eprint("warning: unable to intersect REs with bed %s" % bed.fnp())
    else:
        ret.append((jobargs["etype"], label, bed.fileID, accessions))
    return (fileJson, ret)

class PeakIntersection:
    def __init__(self, args, assembly, runDate = None):
        self.args = args
        self.assembly = assembly
        self.runDate = runDate
        if not runDate:
            self.runDate = arrow.now().format('YYYY-MM-DD')
        self.jobsFnp = paths.path(self.assembly, "extras", self.runDate,
                                  "jobs.json.gz")
        Utils.ensureDir(self.jobsFnp)
        
    def makeJobs(self):
        m = MetadataWS(Datasets.byAssembly(self.assembly))

        allExps = [(m.chipseq_tfs_useful(), "tf"),
                   (m.chipseq_histones_useful(), "histone")]
        allExpsIndiv = []
        for exps, etype in allExps:
            printt("found", len(exps), etype)
            exps = [Exp.fromJsonFile(e.encodeID) for e in exps]
            exps = filter(lambda e: "ERROR" not in e.jsondata["audit"], exps)
            printt("found", len(exps), etype, "after removing ERROR audit exps")
            for exp in exps:
                allExpsIndiv.append((exp, etype))
        random.shuffle(allExpsIndiv)
        total = len(allExpsIndiv)

        i = 0
        jobs = []
        for exp, etype in allExpsIndiv:
            i += 1
            try:
                bed = exp.getUsefulPeakFile(self.assembly)
                if not bed:
                    printt("missing", exp)
                jobs.append({"exp": exp,  # this is an Exp
                             "bed": bed,  # this is an ExpFile
                             "i": i,
                             "total": total,
                             "assembly": self.assembly,
                             "etype": etype})
            except Exception, e:
                printt(str(e))
                printt("bad exp:", exp)

        printt("generated", len(jobs), "jobs")

        jobsOut = []
        for job in jobs:
            j = {"bed": {"expID": job["bed"].expID,
                         "fileID": job["bed"].fileID},
                 "etype": job["etype"],
                 "exp": {"label": job["exp"].label,
                         "biosample_term_name": job["exp"].biosample_term_name
                         }}            
            jobsOut.append(j)
        with gzip.open(self.jobsFnp, 'w') as f:
            json.dump(jobsOut, f)
        printt("wrote", self.jobsFnp)
        
        return jobs

    def computeIntersections(self):
        bedFnp = paths.path(self.assembly, "extras", "cREs.sorted.bed")
        if not os.path.exists(bedFnp):
            Utils.sortFile(paths.path(self.assembly, "raw", "cREs.bed"),
                           bedFnp)

        jobs = self.makeJobs()

        results = Parallel(n_jobs=self.args.j)(
            delayed(runIntersectJob)(job, bedFnp)
            for job in jobs)

        printt("\n")
        printt("merging intersections into hash...")

        tfImap = {}
        fileJsons = []
        filesToAccessions = {}
        for fileJson, accessions in results:
            if not accessions:
                continue
            for etype, label, fileID, accs in accessions:
                filesToAccessions[fileID] = accs
                for acc in accs:
                    if acc not in tfImap:
                        tfImap[acc] = {"tf": {}, "histone": {}}
                    if label not in tfImap[acc][etype]:
                        tfImap[acc][etype][label] = []
                    tfImap[acc][etype][label].append(fileID)
            fileJsons += fileJson

        printt("completed hash merge")

        printt("runDate:", self.runDate)
        outFnp = paths.path(self.assembly, "extras", self.runDate,
                            "peakIntersections.json.gz")
        Utils.ensureDir(outFnp)
        with gzip.open(outFnp, 'w') as f:
            for k, v in tfImap.iteritems():
                f.write('\t'.join([k,
                                   json.dumps(v["tf"]),
                                   json.dumps(v["histone"])
                                   ]) + '\n')
        printt("wrote", outFnp)

        outFnp = paths.path(self.assembly, "extras", self.runDate,
                            "chipseqIntersectionsWithCres.json.gz")
        Utils.ensureDir(outFnp)
        with gzip.open(outFnp, 'w') as f:
            for k, v in filesToAccessions.iteritems():
                f.write('\t'.join([k,
                                   json.dumps(v)]) + '\n')
        printt("wrote", outFnp)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--list', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt("***********************", assembly)
        pi = PeakIntersection(args, assembly)

        if args.list:
            jobs = pi.makeJobs()
            # for j in jobs:
            #     #printt('\t'.join(["list", j["bed"].expID, j["bed"].fileID]))
            #     printt(j["bed"].fileID)
            continue

        printt("intersecting TFs and Histones")
        pi.computeIntersections()

    return 0


if __name__ == '__main__':
    sys.exit(main())
