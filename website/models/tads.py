#!/usr/bin/env python

from __future__ import print_function

from pg_tads import PGtads

class Tads:
    def __init__(self, assembly, ps):
        self.assembly = assembly
        self.pgTads = PGtads(ps, assembly)
    
    def get_biosamples(self):
        return self.pgTads.get_biosamples()

    def get_chrom_btn(self, biosample, chrom):
        return self.pgTads.get_chrom_btn(biosample, chrom)

    def get_chrom_acc(self, acc, chrom):
        return self.pgTads.get_chrom_acc(acc, chrom)
