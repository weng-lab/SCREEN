import cherrypy

from common.page_info_comparison import PageInfoComparison
from common.session import Sessions

class ComparisonController:
    def __init__(self, templates, ps, cache):
        self.t = templates
        self.ps = ps
        self.params = (ps, cache)

    def comparison(self, args, kwargs, uuid):
        pageInfo = PageInfoComparison(*self.params)
        return self.t('main/comparison', **pageInfo.comparisonPage(args, kwargs, uuid))


