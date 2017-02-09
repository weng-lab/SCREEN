#!/usr/bin/env python

from __future__ import print_function

import os
import sys

class CREdownload:
    def __init__(self, pgSearch, cache):
        self.pgSearch = pgSearch
        self.cache = cache

    def bed(self, j, uid):
        try:
            ret = self.downloadAsBed(j, uid)
            return ret
        except:
            raise
            return { "error" : "error running action"}

    def json(self, j, uid):
        try:
            ret = self.downloadAsJson(j, uid)
            return ret
        except:
            raise
            return { "error" : "error running action"}

    def downloadAsBed(self, j, uid):
        outFn, outFnp = self._downloadFileName(uid, "bed")
        self.pgSearch.creTableDownloadBed(j, outFnp)
        url = os.path.join('/', "static", "downloads", uid, outFn)
        return {"url" : url}

    def _downloadFileName(self, uid, formt):
        timestr = time.strftime("%Y%m%d-%H%M%S")
        outFn = '-'.join([timestr, "v4", formt])
        outFnp = os.path.join(self.staticDir, "downloads", uid, outFn)
        Utils.ensureDir(outFnp)
        return outFn, outFnp

    def downloadAsJson(self, j, uid):
        outFn, outFnp = self._downloadFileName(uid, "json")
        self.pgSearch.creTableDownloadJson(j, outFnp)
        url = os.path.join('/', "static", "downloads", uid, outFn)
        return {"url" : url}
