import sys, os, json, cherrypy

from compute_gene_expression import ComputeGeneExpression, Compartments

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle

sys.path.append(os.path.join(os.path.dirname(__file__), '../common'))
from parse_search import ParseSearch

class PageInfoGeneExp:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self, assembly, indexPage = False):
        bundleFnp = os.path.join(os.path.dirname(__file__),
                                 "../ui/dist/bundle.js")
        cssFnp = os.path.join(os.path.dirname(__file__),
                              "../static/css.css")
        return {"page": {"title" : PageTitle(assembly)},
                "indexPage": indexPage,
                "Assembly" : assembly,
                "bundlets" : os.path.getmtime(bundleFnp),
                "cssts" : os.path.getmtime(cssFnp)
        }

    def geneexpPage(self, args, kwargs, uuid):
        assembly = ""
        _gene = ""
        if len(args):
            assembly = args[0]
            gene = kwargs["gene"]

        # FIXME: why do this?
        # it break on
        # geApp/mm10/?gene=Eml6
        # since treating the gene as an alias changes gene to
        # EML6, which is human!
        if 0:
            p = ParseSearch("", self.ps.DBCONN, assembly)
            gene = p._gene_alias_to_symbol(_gene.split(".")[0])
            if not gene:
                gene = p._gene_alias_to_symbol(_gene.split(".")[0])
            if not gene:
                gene = _gene

        ret = self.wholePage(assembly)

        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene})})

        return ret

