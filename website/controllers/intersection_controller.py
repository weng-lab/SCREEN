import cherrypy

from common.page_info_intersection import PageInfoIntersection
from common.session import Sessions

class IntersectionController:
    def __init__(self, templates, ps, cache):
        self.t = templates
        self.ps = ps
        self.params = (ps, cache)

    def Index(self):
        pageInfo = PageInfoIntersection(*self.params)
        return self.t('main/intersection', **pageInfo.wholePage(""))
