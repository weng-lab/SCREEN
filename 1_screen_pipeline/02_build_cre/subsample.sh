#!/bin/bash
#
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
#

DIR=$(dirname $1)
FN=$(basename $1)

zcat $1 | awk 'BEGIN {srand()} !/^$/ { if (rand() <= .01) print $0}' | gzip >  $DIR/sample/$FN

