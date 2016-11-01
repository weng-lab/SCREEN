import cherrypy

from common.page_info_geneexp import PageInfoGeneExp
from common.session import Sessions

class GeneExpController:
    def __init__(self, templates, es, ps, cache):
        self.t = templates
        self.ps = ps
        self.params = (es, ps, cache)

    def geneexp(self, args, kwargs, uuid):
        pageInfo = PageInfoGeneExp(*self.params)
        return self.t('main/geneexp', **pageInfo.geneexpPage(args, kwargs, uuid))


