from natsort import natsorted

from helper_grouper import HelperGrouper

class Rampage:
    def __init__(self, assembly, pgSearch):
        self.assembly = assembly
        self.pgSearch = pgSearch

    def _procees(self, transcript, ri):
        ret = {}
        ret["transcript"] = transcript["transcript"]
        ret["chrom"] = transcript["chrom"]
        ret["start"] = transcript["start"]
        ret["stop"] = transcript["stop"]
        ret["strand"] = transcript["strand"]
        ret["geneinfo"] = transcript["geneinfo"]

        # fold actual data val into each "row"
        items = []
        for fileID, val in transcript["data"].iteritems():
            fileID = fileID.upper()
            info = ri[fileID].copy()
            info["counts"] = round(val, 4)
            items.append(info)

        hg = HelperGrouper(transcript, items)
        ret["itemsByID"] = hg.byID
        ret["itemsGrouped"] = hg.getGroupedItems("counts")
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
            byTranscript[transcript["transcript"]] = info

        transcripts = natsorted(byTranscript.keys())
        return {"sortedTranscripts" : transcripts,
                "tsss" : byTranscript,
                "gene" : gene}
