#!/usr/bin/env python

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


import os
import sys
import shutil
from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from utils import Utils, printWroteNumLines, printt
from files_and_paths import Dirs


def run(inFnp, outFnp):
    printt("making hammock from", inFnp)
    with open(inFnp) as inF:
        with open(outFnp, 'w') as outF:
            for idx, line in enumerate(inF):
                toks = line.rstrip().split('\t')
                attrs = "id:" + str(idx) + ',name:"' + toks[3] + '"'
                if 9 == len(toks):
                    attrs += ",struct:{{thick:[[{s},{e}],],}}".format(s=toks[1], e=toks[2])
                out = toks[:3] + [attrs]
                outF.write("\t".join(out) + '\n')
    printt("sorting")
    Utils.sortFile(outFnp)
    printWroteNumLines(outFnp)

    printt("bgzip")
    cmds = ["bgzip", '-f', outFnp]
    Utils.runCmds(cmds)

    printt("tabix")
    cmds = ["tabix", '-f', outFnp + '.gz']
    Utils.runCmds(cmds)

    printt("wrote", inFnp, outFnp)


def main():
    for assembly in ["hg19", "mm10"]:
        d = os.path.join("/home/purcarom/public_html/encyclopedia/Version-4/ver10/", assembly, "cts")
        outD = os.path.join(d, "washu")
        Utils.mkdir_p(outD)

        for fn in os.listdir(d):
            if not fn.endswith(".bed"):
                continue
            inFnp = os.path.join(d, fn)
            outFnp = os.path.join(outD, fn)
            run(inFnp, outFnp)


if __name__ == '__main__':
    main()
