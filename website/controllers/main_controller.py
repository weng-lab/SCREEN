import cherrypy

from common.page_info import PageInfoMain
from common.session import Sessions

class MainController:
    def __init__(self, templates, es, ps, cache):
        self.t = templates
        self.ps = ps
        self.params = (es, ps)

    def Index(self):
        pageInfo = PageInfoMain(*self.params)
        return self.t('main/index', **pageInfo.wholePage(True))

    def RawQuery(self, q, url):
        pageInfo = PageInfoMain(*self.params)
        return self.t('main/query', **pageInfo.rawQueryPage(q, url))

    def search(self, args, kwargs, uuid):
        pageInfo = PageInfoMain(*self.params)
        return self.t('main/search', **pageInfo.searchPage(args, kwargs, uuid))

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

    def autocomplete(self, j):
        pageInfo = PageInfoMain(*self.params)
        return pageInfo.autocomplete(j)
