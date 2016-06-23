from common.page_info import PageInfoMain

class MainController:
    def __init__(self, templates, DBCONN, species, version):
        self.t = templates
        self.DBCONN = DBCONN
        self.species = species
        self.version = version

    def Index(self):
        pageInfo = PageInfoMain(self.DBCONN, self.species, self.version)
        return self.t('main/index', **pageInfo.wholePage())

    def Query(self, q, url):
        pageInfo = PageInfoMain(self.DBCONN, self.species, self.version)
        return self.t('main/query', **pageInfo.queryPage(q, url))
