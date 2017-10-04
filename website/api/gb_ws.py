import sys, os

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from common.pg import PGsearch

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from config import Config

class GenomeBrowserWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeWS(assembly):
            return GenomeBrowserWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.wss = {a : makeWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.wss[j["assembly"]].process(j, args, kwargs)

class GenomeBrowserWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly

        self.actions = {"geneTrack": self.geneTrack,
                        "trackhub": self.trackhub}

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def geneTrack(self, j, args):
        return {}

    def trackhub(self, j, args):
        return [
{
    "track" : "general_cREs_(9_state)_CTCF",
    "parent": "",
    "type" : "bigBed 9",
    "shortLabel" : "(9 state) CTCF",
    "longLabel" : "general cREs (9 state) CTCF",
    "itemRgb" : "On",
    "visibility" : "dense",
    "priority" : 1,
    "darkerLabels" : "on",
    "bigDataUrl" : "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/hg19-cRE.CTCF.cREs.bigBed",
    "color" : null,
    "maxHeightPixels" : null,
    "autoScale" : null,
    "viewLimits" : null
},
{
    "track" : "general_cREs_(9_state)_H3K27ac",
    "parent": "",
    "type" : "bigBed 9",
    "shortLabel" : "(9 state) H3K27ac",
    "longLabel" : "general cREs (9 state) H3K27ac",
    "itemRgb" : "On",
    "visibility" : "dense",
    "priority" : 2,
    "darkerLabels" : "on",
    "bigDataUrl" : "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/hg19-cRE.Enhancer.cREs.bigBed",
    "color" : null,
    "maxHeightPixels" : null,
    "autoScale" : null,
    "viewLimits" : null
},
{
    "track" : "general_cREs_(9_state)_H3K4me3",
    "parent": "",
    "type" : "bigBed 9",
    "shortLabel" : "(9 state) H3K4me3",
    "longLabel" : "general cREs (9 state) H3K4me3",
    "itemRgb" : "On",
    "visibility" : "dense",
    "priority" : 3,
    "darkerLabels" : "on",
    "bigDataUrl" : "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/hg19-cRE.Promoter.cREs.bigBed",
    "color" : null,
    "maxHeightPixels" : null,
    "autoScale" : null,
    "viewLimits" : null
},
{
    "track" : "cREs_in_K562_(5_group)",
    "parent": "K562_super",
    "type" : "bigBed 9",
    "shortLabel" : "cREs in K562 (5 group)",
    "longLabel" : "cREs in K562 (5 group)",
    "itemRgb" : "On",
    "visibility" : "hide",
    "priority" : 4,
    "darkerLabels" : "on",
    "bigDataUrl" : "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/ENCFF686NUN_ENCFF689TMV_ENCFF000BWY_ENCFF000YMA.cREs.bigBed",
    "color" : null,
    "maxHeightPixels" : null,
    "autoScale" : null,
    "viewLimits" : null
},
{
     "track" : "cREs_in_K562_with_high_DNase_(9_state)",
    "parent": "K562_super",
    "type" : "bigBed 9",
    "shortLabel" : "K562 cREs DNase",
    "longLabel" : "cREs in K562 with high DNase (9 state)",
    "itemRgb" : "On",
    "visibility" : "dense",
    "priority" : 5,
    "darkerLabels" : "on",
    "bigDataUrl" : "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/9-State/ENCFF686NUN.bigBed",
    "color" : null,
    "maxHeightPixels" : null,
    "autoScale" : null,
    "viewLimits" : null
},
{
      "track" : "cREs_in_K562_with_high_H3K4me3_(9_state)",
    "parent": "K562_super",
    "type" : "bigBed 9",
    "shortLabel" : "K562 cREs H3K4me3",
    "longLabel" : "cREs in K562 with high H3K4me3 (9 state)",
    "itemRgb" : "On",
    "visibility" : "dense",
    "priority" : 6,
    "darkerLabels" : "on",
    "bigDataUrl" : "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/9-State/ENCFF689TMV.bigBed",
    "color" : null,
    "maxHeightPixels" : null,
    "autoScale" : null,
    "viewLimits" : null
},
{
    "track" : "cREs_in_K562_with_high_H3k27ac_(9_state)",
    "parent": "K562_super",
    "type" : "bigBed 9",
    "shortLabel" : "K562 cREs H3k27ac",
    "longLabel" : "cREs in K562 with high H3k27ac (9 state)",
    "itemRgb" : "On",
    "visibility" : "dense",
    "priority" : 7,
    "darkerLabels" : "on",
    "bigDataUrl" : "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/9-State/ENCFF000BWY.bigBed",
    "color" : null,
    "maxHeightPixels" : null,
    "autoScale" : null,
    "viewLimits" : null
},
{
     "track" : "cREs_in_K562_with_high_CTCF_(9_state)",
    "parent": "K562_super",
    "type" : "bigBed 9",
    "shortLabel" : "K562 cREs CTCF",
    "longLabel" : "cREs in K562 with high CTCF (9 state)",
    "itemRgb" : "On",
    "visibility" : "dense",
    "priority" : 8,
    "darkerLabels" : "on",
    "bigDataUrl" : "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/9-State/ENCFF000YMA.bigBed",
    "color" : null,
    "maxHeightPixels" : null,
    "autoScale" : null,
    "viewLimits" : null
},
{
      "track" : "ENCFF686NUN_Signal_DNase_K562",
    "parent": "K562_super",
    "type" : "bigWig",
    "shortLabel" : "DNase K562",
    "longLabel" : "ENCFF686NUN Signal DNase K562",
    "itemRgb" : "On",
    "visibility" : "dense",
    "priority" : 9,
    "darkerLabels" : "on",
    "bigDataUrl" : "https://www.encodeproject.org/files/ENCFF686NUN/@@download/ENCFF686NUN.bigWig?proxy=true",
    "color" : "6,218,147",
    "maxHeightPixels" : "128:32:8",
    "autoScale" : "off",
    "viewLimits" : "0:150"
},
{
      "track" : "ENCFF689TMV Signal H3K4me3 K562",
    "parent": "K562_super",
    "type" : "bigWig",
    "shortLabel" : "H3K4me3 K562",
    "longLabel" : "ENCFF689TMV Signal H3K4me3 K562",
    "itemRgb" : "On",
    "visibility" : "full",
    "priority" : 10,
    "darkerLabels" : "on",
    "bigDataUrl" : "https://www.encodeproject.org/files/ENCFF689TMV/@@download/ENCFF689TMV.bigWig?proxy=true",
    "color" : "255,0,0",
    "maxHeightPixels" : "128:32:8",
    "autoScale" : "off",
    "viewLimits" : "0:50"
},
{
      "track" : "ENCFF000BWY_Signal_H3k27ac_K562",
    "parent": "K562_super",
    "type" : "bigWig",
    "shortLabel" : "H3k27ac K562",
    "longLabel" : "ENCFF000BWY Signal H3k27ac K562",
    "itemRgb" : "On",
    "visibility" : "full",
    "priority" : 11,
    "darkerLabels" : "on",
    "bigDataUrl" : "https://www.encodeproject.org/files/ENCFF000BWY/@@download/ENCFF000BWY.bigWig?proxy=true",
    "color" : "255,205,0",
    "maxHeightPixels" : "128:32:8",
    "autoScale" : "off",
    "viewLimits" : "0:50"
},
{
    "track" : "ENCFF000YMA_Signal_CTCF_K562",
    "parent": "K562_super",
    "type" : "bigWig",
    "shortLabel" : "CTCF K562",
    "longLabel" : "ENCFF000YMA Signal CTCF K562",
    "itemRgb" : "On",
    "visibility" : "full",
    "priority" : 12,
    "darkerLabels" : "on",
    "bigDataUrl" : "https://www.encodeproject.org/files/ENCFF000YMA/@@download/ENCFF000YMA.bigWig?proxy=true",
    "color" : "0,176,240",
    "maxHeightPixels" : "128:32:8",
    "autoScale" : "off",
    "viewLimits" : "0:50"
},
{
    "track" : "ENCFF227NLJ_Signal_CAGE___K562",
    "parent": "K562_super",
    "type" : "bigWig",
    "shortLabel" : "ENCFF227NLJ  Signa",
    "longLabel" : "ENCFF227NLJ  Signal CAGE K562",
    "itemRgb" : "On",
    "visibility" : "hide",
    "priority" : 14,
    "darkerLabels" : "on",
    "bigDataUrl" : "https://www.encodeproject.org/files/ENCFF227NLJ/@@download/ENCFF227NLJ.bigWig?proxy=true",
    "color" : null,
    "maxHeightPixels" : "128:32:8",
    "autoScale" : "off",
    "viewLimits" : "0:50"
},
{
    "track" : "ENCFF852ZNV_Signal_CAGE___K562",
    "parent": "K562_super",
    "type" : "bigWig",
    "shortLabel" : "ENCFF852ZNV Signa",
    "longLabel" : "ENCFF852ZNV Signal CAGE K562",
    "itemRgb" : "On",
    "visibility" : "hide",
    "priority" : 15,
    "darkerLabels" : "on",
    "bigDataUrl" : "https://www.encodeproject.org/files/ENCFF852ZNV/@@download/ENCFF852ZNV.bigWig?proxy=true",
    "color" : null,
    "maxHeightPixels" : "128:32:8",
    "autoScale" : "off",
    "viewLimits" : "0:50"
},
{
    "track" : "ENCFF079PRE_Signal_CAGE___K562",
    "parent": "K562_super",
    "type" : "bigWig",
    "shortLabel" : "ENCFF079PRE Signa",
    "longLabel" : "ENCFF079PRE Signal CAGE K562",
    "itemRgb" : "On",
    "visibility" : "hide",
    "priority" : 16,
    "darkerLabels" : "on",
    "bigDataUrl" : "https://www.encodeproject.org/files/ENCFF079PRE/@@download/ENCFF079PRE.bigWig?proxy=true",
    "color" : null,
    "maxHeightPixels" : "128:32:8",
    "autoScale" : "off",
    "viewLimits" : "0:50"
},
{
    "track" : "ENCFF000UOI_Signal_CAGE___K562",
    "parent": "K562_super",
    "type" : "bigWig",
    "shortLabel" : "ENCFF000UOI Signa",
    "longLabel" : "ENCFF000UOI Signal CAGE K562",
    "itemRgb" : "On",
    "visibility" : "hide",
    "priority" : 17,
    "darkerLabels" : "on",
    "bigDataUrl" : "https://www.encodeproject.org/files/ENCFF000UOI/@@download/ENCFF000UOI.bigWig?proxy=true",
    "color" : null,
    "maxHeightPixels" : "128:32:8",
    "autoScale" : "off",
    "viewLimits" : "0:50"
},
{
    "track" : "ENCFF000UOG_Signal_CAGE___K562",
    "parent": "K562_super",
    "type" : "bigWig",
    "shortLabel" : "ENCFF000UOG Signa",
    "longLabel" : "ENCFF000UOG Signal CAGE K562",
    "itemRgb" : "On",
    "visibility" : "hide",
    "priority" : 18,
    "darkerLabels" : "on",
    "bigDataUrl" : "https://www.encodeproject.org/files/ENCFF000UOG/@@download/ENCFF000UOG.bigWig?proxy=true",
    "color" : null,
    "maxHeightPixels" : "128:32:8",
    "autoScale" : "off",
    "viewLimits" : "0:50"
},
{
    "track" : "ENCFF425BKY_Signal_CAGE___K562",
    "parent": "K562_super",
    "type" : "bigWig",
    "shortLabel" : "ENCFF425BKY Signa",
    "longLabel" : "ENCFF425BKY Signal CAGE K562",
    "itemRgb" : "On",
    "visibility" : "hide",
    "priority" : 19,
    "darkerLabels" : "on",
    "bigDataUrl" : "https://www.encodeproject.org/files/ENCFF425BKY/@@download/ENCFF425BKY.bigWig?proxy=true",
    "color" : null,
    "maxHeightPixels" : "128:32:8",
    "autoScale" : "off",
    "viewLimits" : "0:50"
},
{
    "track" : "ENCFF540IXI_Peaks_CAGE___K562",
    "parent": "K562_super",
    "type" : "bigBed",
    "shortLabel" : "ENCFF540IXI Peaks",
    "longLabel" : "ENCFF540IXI Peaks CAGE K562",
    "itemRgb" : "On",
    "visibility" : "dense",
    "priority" : 20,
    "darkerLabels" : "on",
    "bigDataUrl" : "https://www.encodeproject.org/files/ENCFF540IXI/@@download/ENCFF540IXI.bigBed?proxy=true",
    "color" : null,
    "maxHeightPixels" : null,
    "autoScale" : null,
    "viewLimits" : null
}
]
