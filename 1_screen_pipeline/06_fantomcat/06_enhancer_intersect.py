#!/usr/bin/env python

from __future__ import print_function

import sys
import os
import subprocess

from fc_common import FCPaths


class Intersector:

    @staticmethod
    def run():

        # permissive enhancers
        with open(FCPaths.enhancer_intersected + ".tmp", "wb") as o:
            subprocess.call(["bedtools", "intersect", "-wa", "-wb",
                             "-a", FCPaths.permissive_enhancers, "-b", FCPaths.cres], stdout=o)
        with open(FCPaths.enhancer_intersected, "wb") as o:
            subprocess.call(["cut", "-f1-3,5,17", FCPaths.enhancer_intersected + ".tmp"], stdout=o)
        os.remove(FCPaths.enhancer_intersected + ".tmp")

        # robust CAGE
        with open(FCPaths.CAGE_intersected + ".tmp", "wb") as o:
            subprocess.call(["bedtools", "intersect", "-wa", "-wb",
                             "-a", FCPaths.robust_CAGE, "-b", FCPaths.cres], stdout=o)
        with open(FCPaths.CAGE_intersected, "wb") as o:
            subprocess.call(["cut", "-f1-3,5-8,17", FCPaths.CAGE_intersected + ".tmp"], stdout=o)
        os.remove(FCPaths.CAGE_intersected + ".tmp")

def main():
    Intersector.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
