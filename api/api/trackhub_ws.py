#!/usr/bin/python

import sys
import StringIO
import cherrypy
import json
import os
import heapq
import re

from models.trackhubdb import TrackhubDb, UCSC, WASHU, ENSEMBL
from common.db_trackhub import DbTrackhub


class TrackhubController:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def ucsc_trackhub(self, *args, **kwargs):
        tdb = TrackhubDb(self.ps, self.cacheW, self.db, UCSC)
        return tdb.ucsc_trackhub(*args, **kwargs)

    def ensembl_trackhub(self, *args, **kwargs):
        tdb = TrackhubDb(self.ps, self.cacheW, self.db, ENSEMBL)
        return tdb.ensembl_trackhu(*args, **kwargs)

    def washu_trackhub(self, *args, **kwargs):
        tdb = TrackhubDb(self.ps, self.cacheW, self.db, WASHU)
        return tdb.washu_trackhub(*args, **kwargs)
