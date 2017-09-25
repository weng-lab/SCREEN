import cherrypy

from common.page_info import PageInfoMain
from common.session import Sessions

class MainController:
    def __init__(self, templates, ps, cache):
        self.t = templates
        self.ps = ps
        self.params = (ps, cache)

    def Index(self):
        pageInfo = PageInfoMain(*self.params)
        return self.t('main/index', **pageInfo.wholePage(""))

    def RawQuery(self, q, url):
        pageInfo = PageInfoMain(*self.params)
        return self.t('main/query', **pageInfo.rawQueryPage(q, url))

    def search(self, args, kwargs, uuid):
        if "assembly" not in kwargs:
            pageInfo = PageInfoMain(*self.params)
            return self.t("main/index", **pageInfo.wholePage("Error: no search assembly specified."))

        pageInfo = PageInfoSearch(*self.params)
        assembly = kwargs["assembly"]
        info = pageInfo.searchPage(args, kwargs, uuid)
        if "failed" in info:
            print("failed query", info)
            pageInfo = PageInfoMain(*self.params)
            userQueryErr = "Error: no results for search '%s' in assembly %s. Please check your spelling and search assembly and try again." % (info["failed"], assembly)
            return self.t("main/index", **pageInfo.wholePage(userQueryErr))
        return self.t('main/search', **info)

    def element(self, accession):
        pageInfo = PageInfoMain(*self.params)
        return self.t('main/element', **pageInfo.element(accession))

    def Overlap(self, chrom, start, end):
        pageInfo = PageInfoMain(*self.params)
        return self.t('main/query', **pageInfo.overlapPage(chrom, start, end))

    def HexplotView(self, args, kwargs):
        pageInfo = PageInfoMain(*self.params)
        return self.t("main/hexplot", **pageInfo.hexplotPage(args, kwargs))

    def reDetail(self, reAccession, kwargs):
        pageInfo = PageInfoMain(*self.params)
        return pageInfo.reDetail(reAccession, kwargs)

    def reSNPs(self, reAccession, kwargs):
        pageInfo = PageInfoMain(*self.params)
        return pageInfo.reSNPSs(reAccession, kwargs)

    def rePeaks(self, reAccession, kwargs):
        pageInfo = PageInfoMain(*self.params)
        return pageInfo.rePeaks(reAccession, kwargs)
