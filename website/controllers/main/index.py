from common.page_info import PageInfoMain

class MainController:
    def __init__(self, templates, DBCONN, version):
        self.t = templates
        self.DBCONN = DBCONN
        self.version = version

    def Index(self):
        pageInfo = PageInfoMain(self.DBCONN, self.version)
        return self.t('main/index', **pageInfo.wholePage())
