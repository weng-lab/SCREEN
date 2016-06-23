from common.page_info import PageInfoMain

class MainController:
    def __init__(self, templates, es, version):
        self.t = templates
        self.es = es
        self.version = version

    def Index(self):
        pageInfo = PageInfoMain(self.es, self.version)
        return self.t('main/index', **pageInfo.wholePage())

    def Query(self, q, url):
        pageInfo = PageInfoMain(self.es, self.version)
        return self.t('main/query', **pageInfo.queryPage(q, url))

    def Overlap(self, chrom, start, end):
        pageInfo = PageInfoMain(self.es, self.version)
        return self.t('main/query', **pageInfo.overlapPage(chrom, start, end))

    def TestQuery(self):
        pageInfo = PageInfoMain(self.es, self.version)
        return self.t('main/test_els', **pageInfo.testqueryPage())
