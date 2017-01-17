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

    def data(self, gene):

        # ["sepalLength","sepalWidth","petalLength","petalWidth","species"],
        # x = arr[1]
        # y = arr[0]

        return [
            [5.1,3.5,1.4,0.2,"promoter"],
            [4.9,3.0,1.4,0.2,"promoter"],
            [4.7,3.2,1.3,0.2,"promoter"],
            [4.6,3.1,1.5,0.2,"promoter"],
            [5.0,3.6,1.4,0.2,"promoter"],
            [5.4,3.9,1.7,0.4,"promoter"],
            [4.6,3.4,1.4,0.3,"promoter"],
            [5.0,3.4,1.5,0.2,"promoter"],
            [4.4,2.9,1.4,0.2,"promoter"],
            [4.9,3.1,1.5,0.1,"promoter"],
            [5.4,3.7,1.5,0.2,"promoter"],
            [4.8,3.4,1.6,0.2,"promoter"],
            [4.8,3.0,1.4,0.1,"promoter"],
            [4.3,3.0,1.1,0.1,"promoter"],
            [5.8,4.0,1.2,0.2,"promoter"],
            [5.7,4.4,1.5,0.4,"promoter"],
            [5.4,3.9,1.3,0.4,"promoter"],
            [5.1,3.5,1.4,0.3,"promoter"],
            [5.7,3.8,1.7,0.3,"promoter"],
            [5.1,3.8,1.5,0.3,"promoter"],
            [5.4,3.4,1.7,0.2,"promoter"],
            [5.1,3.7,1.5,0.4,"promoter"],
            [4.6,3.6,1.0,0.2,"promoter"],
            [5.1,3.3,1.7,0.5,"promoter"],
            [4.8,3.4,1.9,0.2,"promoter"],
            [5.0,3.0,1.6,0.2,"promoter"],
            [5.0,3.4,1.6,0.4,"promoter"],
            [5.2,3.5,1.5,0.2,"promoter"],
            [5.2,3.4,1.4,0.2,"promoter"],
            [4.7,3.2,1.6,0.2,"promoter"],
            [4.8,3.1,1.6,0.2,"promoter"],
            [5.4,3.4,1.5,0.4,"promoter"],
            [5.2,4.1,1.5,0.1,"promoter"],
            [5.5,4.2,1.4,0.2,"promoter"],
            [4.9,3.1,1.5,0.2,"promoter"],
            [5.0,3.2,1.2,0.2,"promoter"],
            [5.5,3.5,1.3,0.2,"promoter"],
            [4.9,3.6,1.4,0.1,"promoter"],
            [4.4,3.0,1.3,0.2,"promoter"],
            [5.1,3.4,1.5,0.2,"promoter"],
            [5.0,3.5,1.3,0.3,"promoter"],
            [4.5,2.3,1.3,0.3,"promoter"],
            [4.4,3.2,1.3,0.2,"promoter"],
            [5.0,3.5,1.6,0.6,"promoter"],
            [5.1,3.8,1.9,0.4,"promoter"],
            [4.8,3.0,1.4,0.3,"promoter"],
            [5.1,3.8,1.6,0.2,"promoter"],
            [4.6,3.2,1.4,0.2,"promoter"],
            [5.3,3.7,1.5,0.2,"promoter"],
            [5.0,3.3,1.4,0.2,"promoter"],
            [7.0,3.2,4.7,1.4,"enhancer"],
            [6.4,3.2,4.5,1.5,"enhancer"],
            [6.9,3.1,4.9,1.5,"enhancer"],
            [5.5,2.3,4.0,1.3,"enhancer"],
            [6.5,2.8,4.6,1.5,"enhancer"],
            [5.7,2.8,4.5,1.3,"enhancer"],
            [6.3,3.3,4.7,1.6,"enhancer"],
            [4.9,2.4,3.3,1.0,"enhancer"],
            [6.6,2.9,4.6,1.3,"enhancer"],
            [5.2,2.7,3.9,1.4,"enhancer"],
            [5.0,2.0,3.5,1.0,"enhancer"],
            [5.9,3.0,4.2,1.5,"enhancer"],
            [6.0,2.2,4.0,1.0,"enhancer"],
            [6.1,2.9,4.7,1.4,"enhancer"],
            [5.6,2.9,3.6,1.3,"enhancer"],
            [6.7,3.1,4.4,1.4,"enhancer"],
            [5.6,3.0,4.5,1.5,"enhancer"],
            [5.8,2.7,4.1,1.0,"enhancer"],
            [6.2,2.2,4.5,1.5,"enhancer"],
            [5.6,2.5,3.9,1.1,"enhancer"],
            [5.9,3.2,4.8,1.8,"enhancer"],
            [6.1,2.8,4.0,1.3,"enhancer"],
            [6.3,2.5,4.9,1.5,"enhancer"],
            [6.1,2.8,4.7,1.2,"enhancer"],
            [6.4,2.9,4.3,1.3,"enhancer"],
            [6.6,3.0,4.4,1.4,"enhancer"],
            [6.8,2.8,4.8,1.4,"enhancer"],
            [6.7,3.0,5.0,1.7,"enhancer"],
            [6.0,2.9,4.5,1.5,"enhancer"],
            [5.7,2.6,3.5,1.0,"enhancer"],
            [5.5,2.4,3.8,1.1,"enhancer"],
            [5.5,2.4,3.7,1.0,"enhancer"],
            [5.8,2.7,3.9,1.2,"enhancer"],
            [6.0,2.7,5.1,1.6,"enhancer"],
            [5.4,3.0,4.5,1.5,"enhancer"],
            [6.0,3.4,4.5,1.6,"enhancer"],
            [6.7,3.1,4.7,1.5,"enhancer"],
            [6.3,2.3,4.4,1.3,"enhancer"],
            [5.6,3.0,4.1,1.3,"enhancer"],
            [5.5,2.5,4.0,1.3,"enhancer"],
            [5.5,2.6,4.4,1.2,"enhancer"],
            [6.1,3.0,4.6,1.4,"enhancer"],
            [5.8,2.6,4.0,1.2,"enhancer"],
            [5.0,2.3,3.3,1.0,"enhancer"],
            [5.6,2.7,4.2,1.3,"enhancer"],
            [5.7,3.0,4.2,1.2,"enhancer"],
            [5.7,2.9,4.2,1.3,"enhancer"],
            [6.2,2.9,4.3,1.3,"enhancer"],
            [5.1,2.5,3.0,1.1,"enhancer"],
            [5.7,2.8,4.1,1.3,"enhancer"],
            [6.3,3.3,6.0,2.5,"promoter"],
            [5.8,2.7,5.1,1.9,"promoter"],
            [7.1,3.0,5.9,2.1,"promoter"],
            [6.3,2.9,5.6,1.8,"promoter"],
            [6.5,3.0,5.8,2.2,"promoter"],
            [7.6,3.0,6.6,2.1,"promoter"],
            [4.9,2.5,4.5,1.7,"promoter"],
            [7.3,2.9,6.3,1.8,"promoter"],
            [6.7,2.5,5.8,1.8,"promoter"],
            [7.2,3.6,6.1,2.5,"promoter"],
            [6.5,3.2,5.1,2.0,"promoter"],
            [6.4,2.7,5.3,1.9,"promoter"],
            [6.8,3.0,5.5,2.1,"promoter"],
            [5.7,2.5,5.0,2.0,"promoter"],
            [5.8,2.8,5.1,2.4,"promoter"],
            [6.4,3.2,5.3,2.3,"promoter"],
            [6.5,3.0,5.5,1.8,"promoter"],
            [7.7,3.8,6.7,2.2,"promoter"],
            [7.7,2.6,6.9,2.3,"promoter"],
            [6.0,2.2,5.0,1.5,"promoter"],
            [6.9,3.2,5.7,2.3,"promoter"],
            [5.6,2.8,4.9,2.0,"promoter"],
            [7.7,2.8,6.7,2.0,"promoter"],
            [6.3,2.7,4.9,1.8,"promoter"],
            [6.7,3.3,5.7,2.1,"promoter"],
            [7.2,3.2,6.0,1.8,"promoter"],
            [6.2,2.8,4.8,1.8,"promoter"],
            [6.1,3.0,4.9,1.8,"promoter"],
            [6.4,2.8,5.6,2.1,"promoter"],
            [7.2,3.0,5.8,1.6,"promoter"],
            [7.4,2.8,6.1,1.9,"promoter"],
            [7.9,3.8,6.4,2.0,"promoter"],
            [6.4,2.8,5.6,2.2,"promoter"],
            [6.3,2.8,5.1,1.5,"promoter"],
            [6.1,2.6,5.6,1.4,"promoter"],
            [7.7,3.0,6.1,2.3,"promoter"],
            [6.3,3.4,5.6,2.4,"promoter"],
            [6.4,3.1,5.5,1.8,"promoter"],
            [6.0,3.0,4.8,1.8,"promoter"],
            [6.9,3.1,5.4,2.1,"promoter"],
            [6.7,3.1,5.6,2.4,"promoter"],
            [6.9,3.1,5.1,2.3,"promoter"],
            [5.8,2.7,5.1,1.9,"promoter"],
            [6.8,3.2,5.9,2.3,"promoter"],
            [6.7,3.3,5.7,2.5,"promoter"],
            [6.7,3.0,5.2,2.3,"promoter"],
            [6.3,2.5,5.0,1.9,"promoter"],
            [6.5,3.0,5.2,2.0,"promoter"],
            [6.2,3.4,5.4,2.3,"promoter"],
            [5.9,3.0,5.1,1.8,"promoter"]
            ]

    def dePage(self, args, kwargs, uuid):
        assembly = ""
        gene = ""
        if len(args):
            assembly = args[0]
            gene = args[1]
            # TODO: check gene

        data = self.data(gene)

        ret = self.wholePage(assembly)

        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene}),
                    "data" : json.dumps(data) })
        return ret

