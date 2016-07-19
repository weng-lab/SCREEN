from common.page_info import PageInfoMain

class MainController:
    def __init__(self, templates, es, DBCONN, version, webSocketUrl):
        self.t = templates
        self.es = es
        self.DBCONN = DBCONN
        self.version = version
        self.webSocketUrl = webSocketUrl

    def Index(self):
        pageInfo = PageInfoMain(self.es, self.DBCONN, self.version, self.webSocketUrl)
        return self.t('main/index', **pageInfo.wholePage())

    def RawQuery(self, q, url):
        pageInfo = PageInfoMain(self.es, self.DBCONN, self.version, self.webSocketUrl)
        return self.t('main/query', **pageInfo.rawQueryPage(q, url))

    def search(self, args, kwargs):
        pageInfo = PageInfoMain(self.es, self.DBCONN, self.version, self.webSocketUrl)
        return self.t('main/search', **pageInfo.searchPage(args, kwargs))

    def Overlap(self, chrom, start, end):
        pageInfo = PageInfoMain(self.es, self.DBCONN, self.version, self.webSocketUrl)
        return self.t('main/query', **pageInfo.overlapPage(chrom, start, end))

    def HexplotView(self, args, kwargs):
        pageInfo = PageInfoMain(self.es, self.DBCONN, self.version, self.webSocketUrl)
        return self.t("main/hexplot", **pageInfo.hexplotPage(args, kwargs))

    def reDetail(self, reAccession, cellType):
        pageInfo = PageInfoMain(self.es, self.DBCONN, self.version, self.webSocketUrl)
        return pageInfo.reDetail(reAccession, cellType)
