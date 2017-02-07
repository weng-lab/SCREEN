import sys, os

from common.page_info_tf import PageInfoTf
from models.tf import Tf

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from common.pg import PGsearch

class TfController:
    def __init__(self, templates, ps, cacheW):
        self.t = templates
        self.ps = ps
        self.cacheW = cacheW
        self.params = (ps, cacheW)

    def tf(self, args, kwargs, uuid):
        pageInfo = PageInfoTf(*self.params)
        return self.t('main/tf', **pageInfo.tfPage(args, kwargs, uuid))

    def tfJson(self, j):
        assembly = j["GlobalAssembly"]
        cache = self.cacheW[assembly]


        return {}
