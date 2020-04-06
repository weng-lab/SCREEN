#!/usr/bin/env python

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function

import sys
import os
import subprocess

from fc_common import FCPaths


class Intersector:
    @staticmethod
    def run():
        with open(FCPaths.intersected, "wb") as o:
            subprocess.Popen(["bedtools", "intersect", "-wa", "-wb",
                              "-a", FCPaths.genebed, "-b", FCPaths.cres], stdout=o)
        with open(FCPaths.twokb_intersected, "wb") as o:
            subprocess.Popen(["bedtools", "intersect", "-wa", "-wb",
                              "-a", FCPaths.twokb, "-b", FCPaths.cres], stdout=o)


def main():
    Intersector.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
