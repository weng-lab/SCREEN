#!/usr/bin/python

import StringIO

class TrackhubController:
    def __init__(self, templates, es, ps, version, webSocketUrl):
        self.templates = templates
        self.es = es
        self.ps = ps
        self.version = version
        self.webSocketUrl = webSocketUrl        

        self.assembly = "hg19"
        self.debug = False

    def ucsc_trackhub(self, *args, **kwargs):
        print("args:", args)
        args = args[0]
        if not args[0].startswith('EE'):
            return "first arg must be EE<num>"
        re_accession = args[0]

        if 2 == len(args):
            loc = args[1]
            if loc == "hub.txt":
                return self.makeHub()
            if loc == "genomes.txt":
                return self.makeGenomes()
            return "ERROR with path"

        if 3 != len(args):
            return "path too long"

        loc = args[2]
        if loc == "trackDb.txt":
            return self.makeTrackDb()

        return "invalid path"

    def makeGenomes(self):
        return """genome\t{assembly}
trackDb\t{assembly}/trackDb.txt""".format(assembly = self.assembly)

    def makeHub(self):
        f = StringIO.StringIO()
        t = ""
        if self.debug:
            t += "debug "
        t += "ENCODE Candidate Regulatory Elements " + self.assembly

        for r in [["hub", t],
                  ["shortLabel", t],
                  ["longLabel", t],
                  ["genomesFile", "genomes.txt"],
                  ["email", "zhiping.weng@umassmed.edu"]]:
            f.write(" ".join(r) + "\n")
        return f.getvalue()

    def makeTrackDb(self):
        return "here"
        epis = self.epigenomes.GetByAssemblyAndAssays(self.assembly, self.assays)
        epis = filter(lambda e: e.web_id() in self.tissue_ids, epis.epis)

        lines = []
        lines += [self.genes()]

        for wepi in sorted(epis, key=lambda e: e.epi.biosample_term_name):
            lines += [self.predictionTrackHub(wepi)]
            if self.assays.startswith("BothDNaseAnd"):
                if AssayType.Enhancer == self.assayType:
                    lines += [self.compositeTrack(wepi)]
            for exp in wepi.exps():
                try:
                    lines += [self.trackhubExp(exp)]
                except:
                    if self.args.debug:
                        raise
                    pass

        if self.enableVistaTrack():
            lines += [self.vista()]
        lines += [self.phastcons()]

        lines = filter(lambda x: x, lines)

        f = StringIO.StringIO()
        map(lambda line: f.write(line + "\n"), lines)

        return f.getvalue()
