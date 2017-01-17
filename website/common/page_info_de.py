import sys, os, json, cherrypy
import subprocess

from compute_gene_expression import ComputeGeneExpression, Compartments

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle

class PageInfoDe:
    def __init__(self, es, ps, cache):
        self.es = es
        self.ps = ps
        self.cache = cache

    def wholePage(self, assembly, indexPage = False):
        return {"page": {"title" : PageTitle},
                "indexPage": indexPage,
                "reAccessions" : [],
                "Assembly" : assembly,
                "re_json_index" : paths.reJsonIndex(assembly),
                "globalSessionUid" : "",
                "globalTfs" : [],
                "globalCellTypes" : [],
                "globalCellTypeInfo" : {},
                "globalCellTypeInfoArr" : []}

    def dePage(self, args, kwargs, uuid):
        assembly = ""
        gene = ""
        if len(args):
            assembly = args[0]
            gene = args[1]
            # TODO: check gene

        ret = self.wholePage(assembly)

        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene})})
        return ret

