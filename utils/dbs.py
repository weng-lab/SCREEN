#!/usr/bin/env python

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


import os
import sys
import json


class DBS:
    @staticmethod
    def localMetadata(script):
        # assumes .pgpass file, like http://stackoverflow.com/a/28801642
        dbs = {"host": "localhost",
               'user': 'metadata_usr',
               'dbname': 'encodemeta',
               "application_name": script}
        return dbs

    @staticmethod
    def localFactorbook(dbname):
        fnp = os.path.expanduser("~/.fbp.txt")
        if not os.path.exists(fnp):
            print("database password file not found at", fnp)
        return {'host': 'localhost',
                'user': 'factorbook_usr',
                'dbname': dbname,
                'application_name': dbname,
                'password': open(fnp).read().strip()}

    @staticmethod
    def localAnnotations():
        fnp = os.path.expanduser("~/.aws.txt")
        if not os.path.exists(fnp):
            print("database password file not found at", fnp)
        return {'host': 'localhost',
                'user': 'annotations_usr',
                'dbname': 'annotations',
                'password': open(fnp).read().strip()}

    @staticmethod
    def localRegElmViz(isProduction=False):
        fnp = os.path.expanduser("~/.regElmViz.txt")
        if not os.path.exists(fnp):
            print("database password file not found at", fnp)
        host = 'localhost'
        if isProduction:
            host = "postgresql"
        return {'host': host,
                'user': 'regElmViz_usr',
                'dbname': 'regElmViz',
                'password': open(fnp).read().strip()}

    @staticmethod
    def localJobMonitor():
        fnp = os.path.expanduser("~/.jmp.txt")
        if not os.path.exists(fnp):
            print("database password file not found at", fnp)
        return {'host': 'localhost',
                'user': 'job_monitor_usr',
                'dbname': 'job_monitor',
                'password': open(fnp).read().strip()}

    @staticmethod
    def pgdsn(dbhandle):
        try:
            with open("/etc/zlab.json", "r") as f:
                cfg = json.load(f)
                return cfg["databases"]["postgresql"][dbhandle]
        except:
            raise Exception("postgresql dsn not found.")
