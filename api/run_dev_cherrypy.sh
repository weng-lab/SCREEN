#!/bin/sh
#
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
#

SCRIPT=`realpath $0`
SCRIPTPATH=`dirname $SCRIPT`

while [ 1 ]; do
    $SCRIPTPATH/server.py --port=9006 $*;
    sleep 5s;
done

