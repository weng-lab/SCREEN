#!/usr/bin/env python

from __future__ import print_function

import sys, os
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
    assemblies = ["hg19"] #Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        with getcursor(DBCONN, "26_globalobjects$main") as curs:
            g = GlobalPG(assembly)
            g.drop_and_recreate(curs)
            g.doimport([("fantomcat", FCPaths.global_statistics),
                        ("fantomcat_2kb", FCPaths.twokb_statistics)],
                       curs)
            print("imported fantomcat")
            if os.path.exists("/data/projects/cREs/%s/saturation.json" % assembly):
                g.doimport([("saturation", "/data/projects/cREs/%s/saturation.json" % assembly)],
                           curs)
                print("imported saturation")
            if os.path.exists("/data/projects/cREs/%s/CTCF/10000.bed.json" % assembly):
                g.doimport([("ctcf_density_10000", "/data/projects/cREs/%s/CTCF/10000.bed.json" % assembly)],
                           curs)
                print("imported CTCF density")

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
                
