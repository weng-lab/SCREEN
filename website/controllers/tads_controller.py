import cherrypy

from common.page_info_tads import PageInfoTads
from common.session import Sessions

class TadsController:
    def __init__(self, templates, ps, cache):
        self.t = templates
        self.ps = ps
        self.params = (ps, cache)

    def tads(self, args, kwargs, uuid):
        pageInfo = PageInfoTads(*self.params)
        return self.t('main/tads', **pageInfo.tadsPage(args, kwargs, uuid))


