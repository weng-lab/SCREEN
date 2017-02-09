#!/usr/bin/env python

import os, sys, shutil
from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from utils import Utils, printWroteNumLines, printt
from files_and_paths import Dirs

def run(inFnp):
    fn = os.path.basename(inFnp)
    outD = os.path.dirname(inFnp)
    
    outFnp = os.path.join(outD, "washu-" + fn)
    printt("making hammock from", inFnp)
    with open(inFnp) as inF:
        with open(outFnp, 'w') as outF:
            for idx, line in enumerate(inF):
                toks = line.rstrip().split('\t')
                attrs = "id:"+str(idx)+',name:"'+toks[3]+'"'
                if 8 == len(toks):
                    attrs += ",struct:{{thick:[[{s},{e}],],}}".format(s=toks[6], e=toks[7])
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
    run(sys.argv[1])

if __name__ == '__main__':
    main()
