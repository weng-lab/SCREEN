#!/usr/bin/env python

from __future__ import print_function
import os, sys, argparse, json

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from utils import Utils, cat, numLines, printWroteNumLines
from job_runner import JobRunner, PythonJob
from files_and_paths import Dirs, Tools, Genome, Datasets
from factorbook_files import FbDirs
from metadataws import MetadataWS
from peaks import Peaks
from ucsc_utils import UCSC_Utils

def doExtractPeaks(exp):
    allPeakFnp, assembly = exp.getIDRnarrowPeak()
    if not os.path.exists(allPeakFnp):
        print("missing", allPeakFnp)
        raise Exception("missing " + allPeakFnp)

    bigWigFnp, bigWigAssembly = exp.getSingleBigWigSingleFnp()
    if not os.path.exists(bigWigFnp):
        print("missing", bigWigFnp)
        raise Exception("missing " + bigWigFnp)

    peaks = Peaks.fromFnp(assembly, allPeakFnp)

    d = "/nfs/purcarom@zlab2/som"
    outFnp = os.path.join(d, exp.encodeID + ".signal.matrix.gz")

    print(allPeakFnp, bigWigFnp, outFnp)
    cmds = ["/home/purcarom/common/zentLib/bin/test",
            "--bed",
            allPeakFnp,
            bigWigFnp,
            '|', "gzip"
            '>', outFnp]
    Utils.runCmds(cmds)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action="store_true", default=False)
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--process', action="store_true", default=False)
    parser.add_argument('--test', action="store_true", default=False)
    parser.add_argument('--job', type=int, default=0)
    parser.add_argument('-j', type=int, default=4)
    args = parser.parse_args()
    return args

def runJob(jobNum, args = None):
    if not args:
        fbDirs = FbDirs("ver3", "dnase")
        fnp = os.path.join(fbDirs.subpeakCluster, "jobs", str(jobNum))
        with open(fnp) as f:
            args = json.load(f)[0]
    chip = MetadataWS.exp(args[0])
    return doExtractPeaks(chip)

def main():
    args = parse_args()

    if args.job > 0:
        return runJob(args.job)

    jr = JobRunner(scriptFnp = os.path.realpath(__file__),
                   jobType = PythonJob,
                   cpus = args.j)

    for dataset in [Datasets.all_mouse, Datasets.all_human]:
        m = MetadataWS(dataset)
        exps = m.dnases_useful()
        print("found", len(exps), "DNase exps w/ peak files...")
        for exp in sorted(exps):
            jr.append([[exp.encodeID]])

    if args.test:
        return jr.runOne(runJob)

    if args.local:
        jr.run(runJob)

    jobOptions = {"mem" : 12000,
                  "time" : "1:00",
                  "cores" : 1,
                  "queue" : "short" }
    fbDirs = FbDirs("ver3", "dnase")
    jr.cluster(fbDirs.subpeakCluster, jobOptions)

if __name__ == '__main__':
    main()
