import sys, os

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle, chrom_lengths

class GlobalDataController:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def static(self, assembly):
        cache = self.cacheW[assembly]
        return {
            "globalTfs" : [],
            "globalCellCompartments" : [],
            "globalCellTypes" : [],
            "globalCellTypeInfo": cache.globalCellTypeInfo(),
            "globalCellTypeInfoArr": cache.globalCellTypeInfoArr(),
            "globalChromCounts" : cache.chromCounts,
            "globalChromLens" : chrom_lengths[assembly],
            "globalCreHistBins" : cache.creHist,
                       
            
        }
    
