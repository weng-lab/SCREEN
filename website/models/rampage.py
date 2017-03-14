from natsort import natsorted

from helper_grouper import HelperGrouper

class Rampage:
    def __init__(self, assembly, pgSearch):
        self.assembly = assembly
        self.pgSearch = pgSearch

    def _procees(self, trans, ri):
        ret = {}
        ret["transcript"] = trans["transcript"]
        ret["chrom"] = trans["chrom"]
        ret["start"] = trans["start"]
        ret["stop"] = trans["stop"]
        ret["strand"] = trans["strand"]
        ret["geneinfo"] = trans["geneinfo"]

        # fold actual data val into each "row"
        items = []
        for fileID, val in trans["data"].iteritems():
            fileID = fileID.upper()
            info = ri[fileID]
            info["counts"] = round(val, 4)
            items.append(info)

        hg = HelperGrouper(items)

        ret["items"] = { "byTissue" : hg.groupByTissue("counts"),
                         "byTissueMax" : hg.groupByTissueMax("counts"),
                         "byValue" : hg.sortByExpression("counts")}
        return ret

    def getByGene(self, gene):
        ensemblid_ver = gene["ensemblid_ver"]
        transcripts = self.pgSearch.rampageByGene(ensemblid_ver)
        if not transcripts:
            return {"sortedTranscripts" : [],
                    "tsss" : [],
                    "gene" : ""}

        ri = self.pgSearch.rampage_info()
        byTranscript = {}
        for transcript in transcripts:
            info = self._procees(transcript, ri)
            byTranscript[info["transcript"]] = info

        transcripts = natsorted(byTranscript.keys())
        return {"sortedTranscripts" : transcripts,
                "tsss" : byTranscript,
                "gene" : gene}
