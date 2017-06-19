#!/usr/bin/env python

from __future__ import print_function

import sys, os
import json
import md5

sys.path.append("../../../metadata/utils")
from utils import Utils, eprint
from files_and_paths import Dirs, Tools, Genome, Datasets, Urls, Webservice

def download_and_parse(url):
    f = "/tmp/%s" % md5.md5(url).hexdigest()
    Utils.download(url, f)
    with open(f, "rb") as _f:
        return json.loads(_f.read())

class CistromeWS:
    def __init__(self, species, url):
        self._url = os.path.join(url, species)

    def dnases(self):
        return [] # MetadataWS._toExps(self.dataset.webserviceDNase)

    def chipseq_tfs(self):
        return download_and_parse(os.path.join(self._url, "tf"))["results"]

    def chipseq_histones(self):
        return download_and_parse(os.path.join(self._url, "histone"))["results"]
