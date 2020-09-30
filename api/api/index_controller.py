
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng

import cherrypy

from common.page_info import PageInfoMain
from common.session import Sessions


class IndexController:
    def __init__(self, templates, ps, cache):
        self.t = templates
        self.ps = ps
        self.params = (ps, cache)

    def Index(self):
        pageInfo = PageInfoMain(*self.params)
        return self.t('main/index', **pageInfo.wholePage(""))
