#!/usr/bin/env python2

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function

import sys
import os
import argparse

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath
from db_utils import getcursor

AddPath(__file__, "../1_screen_pipeline/06_fantomcat")
from fc_common import FCPaths

AddPath(__file__, '../common/')
from dbconnect import db_connect
from pgglobal import GlobalPG


def run(args, DBCONN):
    assemblies = ["hg19", "hg38"]  # Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        with getcursor(DBCONN, "26_globalobjects$main") as curs:
            g = GlobalPG(assembly)
            g.drop_and_recreate(curs)
            if os.path.exists(FCPaths.global_statistics) and os.path.exists(FCPaths.twokb_statistics):
                g.doimport([("fantomcat", FCPaths.global_statistics),
                            ("fantomcat_2kb", FCPaths.twokb_statistics)],
                           curs)
                print("imported fantomcat")
            if os.path.exists("/data/projects/cREs/%s/saturation.json" % assembly):
                g.doimport([("saturation", "/data/projects/cREs/%s/saturation.json" % assembly)],
                           curs)
                if assembly == "hg38":
                    g.doimport([("saturation_encode", "/data/projects/cREs/%s/saturation.encode.json" % assembly)],
                               curs)
                    g.doimport([("saturation_encode_cistrome", "/data/projects/cREs/%s/saturation.encode+cistrome.json" % assembly)],
                               curs)
                print("imported saturation")
            if os.path.exists("/data/projects/cREs/%s/CTCF/10000.bed.json" % assembly):
                g.doimport([("ctcf_density_10000", "/data/projects/cREs/%s/CTCF/10000.bed.json" % assembly)],
                           curs)
                print("imported CTCF density")
            if "hg19" == assembly:
                for a in ["hg19", "hg38"]:
                    for b in ["hg19", "hg38"]:
                        if os.path.exists("/data/projects/cREs/%s/CTA.%s.intersected.json" % (a, b)):
                            g.doimport([("liftOver_%s_%s" % (a, b), "/data/projects/cREs/%s/CTA.%s.intersected.json" % (a, b))],
                                       curs)
                    if os.path.exists("/data/projects/cREs/hg38/CTA.%s.cistromeintersected.json" % a):
                        g.doimport([("encode_cistrome_%s" % a, "/data/projects/cREs/hg38/CTA.%s.cistromeintersected.json" % a)],
                                   curs)
                print("imported liftOver intersect fractions")


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()
    DBCONN = db_connect(os.path.realpath(__file__))
    return run(args, DBCONN)


if __name__ == "__main__":
    sys.exit(main())
