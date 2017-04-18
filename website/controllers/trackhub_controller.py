#!/usr/bin/python

import sys
import StringIO
import cherrypy
import json
import os
import heapq
import re

from models.cre import CRE
from models.trackhubdb import TrackhubDb, UCSC, WASHU, ENSEMBL
from common.pg import PGsearch
from common.db_trackhub import DbTrackhub
from common.coord import Coord

class TrackhubController:
    def __init__(self, templates, ps, cacheW):
        self.templates = templates
        self.ps = ps
        self.cacheW = cacheW
        self.db = DbTrackhub(self.ps.DBCONN)

    def ucsc_trackhub(self, *args, **kwargs):
        tdb = TrackhubDb(self.templates, self.ps, self.cacheW, self.db, UCSC)
        return tdb.ucsc_trackhub(*args, **kwargs)

    def ensembl_trackhub(self, *args, **kwargs):
        tdb = TrackhubDb(self.templates, self.ps, self.cacheW, self.db, ENSEMBL)
        return tdb.ensembl_trackhu(*args, **kwargs)

    def washu_trackhub(self, *args, **kwargs):
        tdb = TrackhubDb(self.templates, self.ps, self.cacheW, self.db, WASHU)
        return tdb.washu_trackhub(*args, **kwargs)

    def _trackhub_url_info(self, j):
        assembly = self.assembly = j["GlobalAssembly"]
        pgSearch = PGsearch(self.ps, assembly)

        accession = j["accession"]
        cre = CRE(pgSearch, accession, self.cacheW[assembly])
        coord = cre.coord()
        coord.resize(j["halfWindow"])

        return assembly, accession, coord

    def ucsc_trackhub_url(self, j, uuid):
        assembly, accession, coord = self._trackhub_url_info(j)
        hubNum = self.db.insertOrUpdate(assembly, accession, uuid, j)

        c = Coord(j["coord_chrom"], j["coord_start"], j["coord_end"])

        trackhubUrl = '/'.join([j["host"],
                                "ucsc_trackhub",
		                uuid,
		                "hub_" + str(hubNum) + ".txt"])

        url = "https://genome.ucsc.edu/cgi-bin/hgTracks?"
	url += "db=" + assembly
	url += "&position=" + str(coord)
	url += "&hubClear=" + trackhubUrl;
        url += "&highlight=" + assembly + "." + c.chrom + "%3A" + str(c.start) + '-' + str(c.end)

        if "hg19" == assembly:
            url += "&g=wgEncodeGencodeV19"
            url += "&g=phastCons100way"

        if "mm10" == assembly:
            # FIXME
            pass
            
        return {"url" : url, "trackhubUrl" : trackhubUrl}

    def ucsc_trackhub_url_snp(self, j, uuid):
        assembly = self.assembly = j["GlobalAssembly"]
        pgSearch = PGsearch(self.ps, assembly)

        snp = j["snp"]
        c = Coord(snp["chrom"], snp["cre_start"], snp["cre_end"])

        hubNum = self.db.insertOrUpdate(assembly, snp["accession"], uuid, j)
        
        trackhubUrl = '/'.join([j["host"],
                                "ucsc_trackhub",
		                uuid,
		                "hub_" + str(hubNum) + ".txt"])

        url = "https://genome.ucsc.edu/cgi-bin/hgTracks?"
	url += "db=" + assembly
	url += "&position=" + str(c)
	url += "&hubClear=" + trackhubUrl;
        url += "&highlight=" + assembly + "." + c.chrom + "%3A" + str(snp["snp_start"]) + '-' + str(snp["snp_end"])

        if "hg19" == assembly:
            url += "&g=wgEncodeGencodeV19"
            url += "&g=phastCons100way"
            
        return {"url" : url, "trackhubUrl" : trackhubUrl}

    def ensembl_trackhub_url(self, j, uuid):
        assembly, accession, coord = self._trackhub_url_info(j)
        hubNum = self.db.insertOrUpdate(assembly, accession, uuid)

        species = {"hg19" : "Homo_sapiens",
                   "mm10" : "Mus_musculus"}

        # from http://useast.ensembl.org/info/website/adding_trackhubs.html
        # http://www.ensembl.org/Trackhub?url=http://www.coolgenomics.ac.uk/hub.txt;species=Homo_sapiens;r=X:123456-123789

        url = "http://www.ensembl.org/Trackhub?"
        trackhubUrl = '/'.join([j["host"],
                                "ensembl_trackhub",
		                uuid,
		                "hub_" + str(hubNum) + ".txt"])

	url += "&url=" + trackhubUrl
        url += ";species=" + species[assembly]
        url += ";r=" + coord.chrom[3:] + ':' + coord.start + '-' + coord.end;

        return {"url" : url, "trackhubUrl" : trackhubUrl}

    def washu_trackhub_url(self, j, uuid):
        assembly, accession, coord = self._trackhub_url_info(j)
        hubNum = self.db.insertOrUpdate(assembly, accession, uuid, j)

        trackhubUrl = '/'.join([j["host"],
                                "washu_trackhub",
		                uuid,
                                assembly,
                                "trackDb_{hn}.json".format(hn = hubNum)])

        url = "http://epigenomegateway.wustl.edu/browser/"
        url += "?genome=" + assembly
        url += "&datahub=" + trackhubUrl
        url += "&coordinate=" + str(coord)

        return {"url" : url, "trackhubUrl" : trackhubUrl}
