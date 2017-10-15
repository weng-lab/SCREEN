from __future__ import print_function

import sys
import os
import gzip
import json

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt, printWroteNumLines

AddPath(__file__, '../../common/')
from common import printr, printt


def doIntersection(cres, others):
    try:
        return [p.rstrip().split("\t")[4] for p in Utils.runCmds([
            "bedtools", "intersect", "-a", cres, "-b", others, "-wa"
        ])]
    except:
        print("pcommon$doIntersection: failed to intersect %s with %s" % (cres, others),
              file=sys.stderr)


def runIntersectJob(jobargs, bedfnp):
    if not os.path.exists(jobargs["bed"]["fnp"]):
        print("pcommon$runIntersectJob: missing bed %s; cannot intersect" % jobargs["bed"]["fnp"],
              file=sys.stderr)
        return None

    ret = []
    printr("pcommon$runIntersectJob: (exp %d of %d)" % (jobargs["i"], jobargs["total"]),
           "intersecting", jobargs["etype"], jobargs["label"])
    accessions = doIntersection(bedfnp, jobargs["bed"]["fnp"])
    if accessions is None:
        print("pcommon$runIntersectJob: warning: unable to intersect REs with bed %s" % jobargs["bed"]["fnp"],
              file=sys.stderr)
    else:
        ret.append((jobargs["etype"], jobargs["label"], jobargs["bed"]["fileID"], accessions))
    return ret


def processResults(results, outFnp):
    tfImap = {}
    fileJsons = []
    for fileJson, accessions in results:
        if not accessions:
            continue
        for etype, label, fileID, accs in accessions:
            for acc in accs:
                if acc not in tfImap:
                    tfImap[acc] = {"tf": {}, "histone": {}}
                if label not in tfImap[acc][etype]:
                    tfImap[acc][etype][label] = []
                tfImap[acc][etype][label].append(fileID)
        fileJsons += fileJson

    printt("completed hash merge")

    with gzip.open(outFnp, 'w') as f:
        for k, v in tfImap.iteritems():
            f.write('\t'.join([k,
                               json.dumps(v["tf"]),
                               json.dumps(v["histone"])
                               ]) + '\n')
    printt("wrote", outFnp)
