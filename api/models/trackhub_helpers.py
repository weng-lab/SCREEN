#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng




import re

def viz(state, active):
    if active:
        return state
    return "hide"

def sanitize(s, replChar='_'):
    return re.sub('[^0-9a-zA-Z]+', replChar, s)

def makeTrackName(n):
    n = n.replace(" ", "_").replace('(','').replace(')','')
    n = n[:100]
    return n

def makeLongLabel(*n):
    return ' '.join([x for x in n if x])[:80]

def makeShortLabel(*n):
    return ' '.join([x for x in n if x])[:17]
