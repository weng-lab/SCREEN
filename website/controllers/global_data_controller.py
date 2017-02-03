import sys, os

class GlobalDataController:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def static(self, assembly, ver):
        cache = self.cacheW[assembly]
        return cache.global_data()
