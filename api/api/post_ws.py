
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng



import os
import sys
import json
import time
import cherrypy
import uuid as uuider
import tempfile

from common.pg_cart import PGcart

sys.path.append(os.path.join(os.path.dirname(__file__), "../../utils"))
from utils import Utils

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from config import Config
from cre_utils import checkChrom
from parse_search import ParseSearch


class PostWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeWS(assembly):
            return PostWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.wss = {a: makeWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.wss[j["assembly"]].process(j, args, kwargs)


class PostWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly

        self.actions = {"lines": self.lines}

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:], kwargs)
        except:
            raise

    def lines(self, j, args, kwargs):
        uuid = j["uuid"]
        lines = j["allLines"]
        assembly = j["assembly"]

        with tempfile.NamedTemporaryFile('wt', dir = Config.bedupload["incomingDir"]) as f:
            for arr in lines:
                arr = arr.strip()
                f.write(arr + '\n')
            f.flush()

            cres = {"hg19": Config.bedupload["hg19bed"],
                    "mm10": Config.bedupload["mm10bed"],
                    "GRCh38": Config.bedupload["grch38bed"]}

            cmds = ["cat", f.name,
                    '|', 'sort -k1,1 -k2,2n',
                    '|', 'bedtools intersect -a ', cres[assembly], ' -b stdin'
                    '|', 'sort | uniq',
                    '|', "head -n 1000",
                    '|', "awk '{ print $5 }'"]
            accessions = Utils.runCmds(cmds)
        accessions = [x.strip() for x in accessions]

        ret = {"uuid": uuid,
               "accessions": accessions}
        return ret
