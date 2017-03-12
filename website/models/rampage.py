FixedTissueColors = {
    "ESC": "#77FF44",
    "blood": "#880000",
    "bone marrow": "#AACCAA",
    "brain": "#AA8888",
    "neural tube": "#AA8888",
    "breast": "#33AA00",
    "colon": "#AAAA55",
    "embryonic structure": "#AAAAFF",
    "eye": "#6600CC",
    "fat": "#FFFF55",
    "heart": "#880055",
    "intestine": "#9900AA",
    "kidney": "#77AABB",
    "liver": "#884400",
    "lung": "#CCCCCC",
    "mammary": "#991111",
    "muscle": "#119911",
    "pancreas": "#AA88AA",
    "placenta": "#FF9977",
    "prostate": "#00AA88",
    "skin": "#BBAA44",
    "stomach": "#44AAFF",
    "uterus": "#990033",
    'adrenal gland' : "#BBAA44",
    'blood vessel' : '#880000',
    'bone' : "#BBAA44",
    'bronchus' : "#BBAA44",
    'cartilage' : "#BBAA44",
    'connective tissue' : "#BBAA44",
    'esophagus' : "#BBAA44",
    'extraembryonic structure' : "#BBAA44",
    'gonad' : "#BBAA44",
    'iPSC' : "#BBAA44",
    'large intestine' : "#BBAA44",
    'lymphoid' : "#BBAA44",
    'mammary gland' : "#BBAA44",
    'mouth' : "#BBAA44",
    'muscle organ' : "#BBAA44",
    'myometrium' : "#BBAA44",
    'nervous system' : "#BBAA44",
    'olfactory organ' : "#BBAA44",
    'prostate gland' : "#00AA88",
    'skin of body' : "#BBAA44",
    'spinal cord' : "#BBAA44",
    'spleen' : "#BBAA44",
    'thyroid gland' : "#BBAA44",
    'trachea' : "#BBAA44",
    'urinary bladder' : "#BBAA44",
    'vagina' : "#BBAA44"
}

fixedmap = {"limb": "limb",
            "embryonic facial prominence": "embryonic structure",
            "CH12.LX": "blood",
            "neural tube": "neural tube",
            "intestine": "intestine",
            "hematopoietic stem cell": "blood",
            "G1E": "embryonic stem cell",
            "MEP": "blood",
            "G1E-ER4": "embryonic stem cell",
            "CMP": "blood" }

class TissueColors:
    def __init__(self):
        self.randColorGen = lambda: random.randint(0,255)
        self.tissueColors = {}

    def randColor(self):
        return '#%02X%02X%02X' % (self.randColorGen(),
                                  self.randColorGen(),
                                  self.randColorGen())

    def getTissueColor(self, t):
        if t in FixedTissueColors:
            return FixedTissueColors[t]
        if t not in self.tissueColors:
            self.tissueColors[t] = self.randColor()
        return self.tissueColors[t]

class Rampage:
    def __init__(self, assembly, pgSearch):
        self.assembly = assembly
        self.pgSearch = pgSearch

    def groupByTissue(self, rows):
        sorter = lambda x: x["tissue"]
        rows.sort(key = sorter)

        ret = {}
        for row in rows:
            t = row["tissue"]
	    if t not in ret:
                c = self.getTissueColor(t)
	        ret[t] = {"name" : t,
                          "displayName" : t,
                          "color": c,
                          "items": []}
            ret[t]["items"].append(row)
        return ret

    def _makeRows(self, rows):
        pass

    def _procees(self, ri, r, idx):
        ret = {}
        ret["gene"] = r["ensemblid_ver"]
        ret["tss"] = r["tss"]
        ret["tss_sane"] = r["tss"].replace(".", "").replace("_", "")
        ret["tab_active"] = ""
        if 0 == idx:
            ret["tab_active"] = "active"

        ret["chrom"] = r["chrom"]
        ret["start"] = r["start"]
        ret["stop"] = r["stop"]

        ee = {}
        for expID, v in r["data"].iteritems():
            expID = expID.upper()
            ee[expID] = {
                "color" : "#880000",
                "displayName" : ri[expID]["tissue"],
                "items" : [{"tissue": ri[expID]["tissue"],
                            "cellType": ri[expID]["btn"],
                            "rep": 1,
                            "counts" : v,
                            "expID": expID}],
                "name" : expID }

        ret["items"] = {}
        ret["items"]["all"] = ee
        return r["tss"], ret

    def get(self, coord):
        rampage = self.pgSearch.rampage(coord)
        if not rampage:
            return None

        ri = self.pgSearch.rampage_info()
        ret = {}
        for idx, r in enumerate(rampage):
            tss, info = self._procees(ri, r, idx)
            ret[tss] = info
        return ret

    def getByGene(self, gene):
        ensemblid_ver = gene["ensemblid_ver"]
        rampage = self.pgSearch.rampageByGene(ensemblid_ver)
        if not rampage:
            return None

        ri = self.pgSearch.rampage_info()
        ret = {}
        for idx, r in enumerate(rampage):
            tss, info = self._procees(ri, r, idx)
            ret[tss] = info
        return ret


