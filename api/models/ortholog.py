
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng

import os
import sys


class Ortholog:
    def __init__(self, pw, assembly, acc, other):
        self.pw = pw
        self.assembly = assembly
        self.acc = acc
        self.tablename = assembly + "_liftover_" + other

        self.dbresults = self.pw.fetchall("Ortholog$init", """
        SELECT chrom, start, stop, otherAccession
        FROM {tablename}
        WHERE thisAccession = '{acc}'""".format(acc=acc,
                                                tablename=self.tablename))

    def as_dict(self):
        if not self.dbresults:
            return []
        return [{"chrom": dbresult[0],
                 "start": dbresult[1],
                 "stop": dbresult[2],
                 "accession": dbresult[3]} for dbresult in self.dbresults]
