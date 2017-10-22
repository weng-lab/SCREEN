#!/usr/bin/env python

from __future__ import print_function

import os
import sys
import shutil
import datetime

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../../metadata/utils"))
from utils import Utils, printt

Dir = os.path.dirname(os.path.realpath(__file__))

prodDir = os.path.join(Dir, "prod")
if os.path.exists(prodDir):
    t = os.path.getmtime(prodDir)
    mdt = datetime.datetime.fromtimestamp(t)
    dn = mdt.strftime('%Y-%m-%d-%H-%M-%S')
    ndir = os.path.join(Dir, "prod.old", dn)
    shutil.move(prodDir, ndir)
    printt("moved", prodDir, "to", ndir)

buildDir = os.path.join(Dir, "build")
shutil.move(buildDir, prodDir)
printt("moved", buildDir, "to", prodDir)
