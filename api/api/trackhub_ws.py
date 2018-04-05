#!/usr/bin/python

import sys
import StringIO
import cherrypy
import json
import os

from models.trackhubdb import TrackhubDb
from common.db_trackhub import DbTrackhub


class TrackhubController:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def ucsc_trackhub(self, *args, **kwargs):
        tdb = TrackhubDb(self.ps, self.cacheW, self.db)
        return tdb.ucsc_trackhub(*args, **kwargs)

