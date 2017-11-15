#!/bin/sh

SCRIPT=`realpath $0`
SCRIPTPATH=`dirname $SCRIPT`

while [ 1 ]; do
    $SCRIPTPATH/server.py  --port=9006 --production
    sleep 5
done
