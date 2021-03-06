#!/usr/bin/env python2

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function
import argparse
import sys
import os
import psycopg2
from collections import OrderedDict
from importlib import import_module

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor
from utils import AddPath, printt

AddPath(__file__, '../common/')
from dbconnect import db_connect


def runAll(args, DBCONN, startIdx, skipIdx):

    steps = OrderedDict()
    for fn in sorted(os.listdir(os.path.dirname(os.path.realpath(__file__)))):
        if not fn.endswith(".py"):
            continue
        if fn.startswith("00_all") or fn.startswith("9") or not '_' == fn[2]:
            continue
        num = fn.split('_')[0]
        if int(num) < int(startIdx):
            continue
        if int(num) == int(skipIdx):
            continue
        # http://stackoverflow.com/a/8790232
        name = fn.rsplit('.', 1)[0]
        print(name)
        try:
            mod = import_module(name)
            steps[name] = getattr(mod, "run")
        except:
            print("problem importing", fn)
            raise

    for name, f in steps.iteritems():
        f = steps[name]
        printt("**********************************************", name)
        f(args, DBCONN)


def vacumnAnalyze(conn, tableName):
    # http://stackoverflow.com/a/1017655
    print("about to vacuum analyze", tableName)
    old_isolation_level = conn.isolation_level
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    curs = conn.cursor()
    curs.execute("vacuum analyze " + tableName)
    conn.set_isolation_level(old_isolation_level)


def vacAll(DBCONN):
    with getcursor(DBCONN, "pg") as curs:
        curs.execute("""SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'""")
        tables = [t[0] for t in curs.fetchall()]
    for t in sorted(tables):
        conn = DBCONN.getconn()
        vacumnAnalyze(conn, t)
        DBCONN.putconn(conn)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--vac', action="store_true", default=False)
    parser.add_argument('--sample', action="store_true", default=False)
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--skip", type=int, default=-1)
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    if args.vac:
        return vacAll(DBCONN)

    # http://stackoverflow.com/a/14903641
    class PassedArgs(object):
        def __init__(self, **kw):
            self.__dict__.update(kw)
    passedArgs = PassedArgs(assembly=args.assembly,
                            sample=args.sample,
                            index=False,
                            metadata=False,
                            yes=True,
                            nbins=0,
                            ver=4,
                            j=8)

    runAll(passedArgs, DBCONN, args.start, args.skip)
    vacAll(DBCONN)

    return 0


if __name__ == '__main__':
    main()
