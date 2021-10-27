#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng



import sys
import os
import json


class Config:
    fnp = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../config.json")
    if not os.path.exists(fnp):
        print("ERROR: file not found:", fnp)
        print("\tfile should be symlink'd to a desired config.<blah>.json file")
        sys.exit(1)

    with open(fnp) as f:
        c = json.load(f)

    re = c["RE"]

    partial_assemblies = re["partial_assemblies"] if "partial_assemblies" in re else []
    version = re["version"]
    db_host = re["db_host"]
    db_usr = re["db_usr"]
    db_port = re["db_port"]
    db = re["db"]
    assemblies = re["assemblies"]
    minipeaks_ver = re["minipeaks_ver"]
    minipeaks_nbins = re["minipeaks_nbins"]
    ribbon = re["ribbon"]
    GoogleAnalytics = re["googleAnalytics"]
    memcache = re["memcache"]
    cassandra = re["cassandra"]
    redisHost = re["redisHost"]
    bedupload = c["bedupload"]
    downloadDir = re["downloadDir"]
    rnaSeqIsNorm = re["rnaSeqIsNorm"]
    uiURL = re["ui_url"]

    #peakIntersectionRunDate = re["peakIntersectionRunDate"]
    #cistromePeakIntersectionRunDate = re["cistromePeakIntersectionRunDate"]
