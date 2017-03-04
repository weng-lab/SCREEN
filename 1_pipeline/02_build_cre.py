#!/usr/bin/env python

from __future__ import print_function
import os, sys
import ujson as json
import argparse
import fileinput, StringIO
import gzip
import random

from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from constants import paths, chroms
from common import printr, printt

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from get_yes_no import GetYesNoToQuestion

def run(assembly):
    runFnp = os.path.join(os.path.dirname(__file__), '02_build_cre/bin/read_json')
    if not os.path.exists(runFnp):
        raise Exception("missing executable " + runFnp)

    if GetYesNoToQuestion.immediate("rebuild cRE files?", "no"):
        cmds = [runFnp, "--assembly=" + assembly]
        printt("about to run", " ".join(cmds))
        Utils.runCmds(cmds)

    fnps = paths.fnpCreTsvs(assembly, "chr*.tsv")
    cmds = ["pigz", "-f", fnps]
    printt("about to run", " ".join(cmds))
    Utils.runCmds(cmds)

    subsampleFnp = os.path.join(os.path.dirname(__file__),
                                '02_build_cre/subsample.sh')
    d = paths.fnpCreTsvs(assembly, "sample")
    Utils.mkdir_p(d)
    fnps = paths.fnpCreTsvs(assembly, "chr*.tsv.gz")
    cmds = ["ls", fnps,
            '|', "parallel", "bash", subsampleFnp]
    printt("about to run", " ".join(cmds))
    Utils.runCmds(cmds)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--assembly', type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    assemblies = ["hg19", "mm10"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        run(assembly)

    return 0

if __name__ == '__main__':
    sys.exit(main())
