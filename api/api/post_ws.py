from __future__ import print_function

import os
import sys
import json
import time
import cherrypy
import uuid as uuider
import tempfile

from common.pg_cart import PGcart

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
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

        f, filename = tempfile.mkstemp(dir=Config.bedupload["incomingDir"])
        for arr in lines:
            arr = arr.strip()
            os.write(f, arr + '\n')
        os.close(f)

        cres = {"hg19": Config.bedupload["hg19bed"],
                "mm10": Config.bedupload["mm10bed"]}

        cmds = ["cat", filename,
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
