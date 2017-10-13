#!/usr/bin/env python

from __future__ import print_function

import sys
import os
import requests

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, eprint
from files_and_paths import Dirs, Tools, Genome, Datasets, Urls, Webservice


def download_and_parse(url):
    return requests.get(url).json()


class CistromeWS:
    def __init__(self, species, url):
        self._url = os.path.join(url, species)

    def dnases(self):
        return []  # MetadataWS._toExps(self.dataset.webserviceDNase)

    def chipseq_tfs(self):
        return download_and_parse(os.path.join(self._url, "tf"))["results"]

    def chipseq_histones(self):
        return download_and_parse(os.path.join(self._url, "histone"))["results"]
