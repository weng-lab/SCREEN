from common.page_info import PageInfoMain

class MainController:
    def __init__(self, templates, es, DBCONN, version):
        self.t = templates
        self.es = es
        self.DBCONN = DBCONN
        self.version = version

    def Index(self):
        pageInfo = PageInfoMain(self.es, self.DBCONN, self.version)
        return self.t('main/index', **pageInfo.wholePage())

    def RawQuery(self, q, url):
        pageInfo = PageInfoMain(self.es, self.DBCONN, self.version)
        return self.t('main/query', **pageInfo.rawQueryPage(q, url))

    def Query(self, q):
        pageInfo = PageInfoMain(self.es, self.DBCONN, self.version)
        return self.t('main/search', **pageInfo.queryPage(q))

    def Overlap(self, chrom, start, end):
        pageInfo = PageInfoMain(self.es, self.DBCONN, self.version)
        return self.t('main/query', **pageInfo.overlapPage(chrom, start, end))

    def TestQuery(self, args, kwargs):
        pageInfo = PageInfoMain(self.es, self.DBCONN, self.version)
        return self.t('main/test_els', **pageInfo.testqueryPage(args, kwargs))
