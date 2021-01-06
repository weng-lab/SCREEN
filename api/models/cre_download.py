#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng




import os
import sys
import time

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer


class CREdownload:
    def __init__(self, pgSearch, downloadDir):
        self.pgSearch = pgSearch
        self.downloadDir = downloadDir

    def bed(self, j):
        try:
            ret = self.downloadAsBed(j, j["uuid"])
            return ret
        except:
            raise
            return {"error": "error running action"}

    def json(self, j, cache):
        try:
            ret = self.downloadAsJson(j, j["uuid"], cache)
            return ret
        except:
            raise
            return {"error": "error running action"}

    def downloadAsBed(self, j, uuid):
        outFn, outFnp = self._downloadFileName(uuid, ".bed.txt")
        self.pgSearch.creTableDownloadBed(j, outFnp)
        url = os.path.join('/', "downloads", uuid, outFn)
        return {"url": url}

    def _downloadFileName(self, uuid, formt):
        timestr = time.strftime("%Y%m%d-%H%M%S")
        outFn = '-'.join([timestr, "v4"]) + formt
        outFnp = os.path.join(self.downloadDir, uuid, outFn)
        Utils.ensureDir(outFnp)
        return outFn, outFnp

    def downloadAsJson(self, j, uuid, cache):
        outFn, outFnp = self._downloadFileName(uuid, ".json")
        self.pgSearch.creTableDownloadJson(j, outFnp, cache)
        url = os.path.join('/', "downloads", uuid, outFn)
        return {"url": url}

    def gwas(self, j, uuid):
        outFn, outFnp = self._downloadFileName(uuid, ".gwas.json")
        self.pgSearch.gwasJson(j, outFnp)
        url = os.path.join('/', "downloads", uuid, outFn)
        return {"url": url}
