#!/bin/sh

SCRIPT=`realpath $0`
SCRIPTPATH=`dirname $SCRIPT`

while [ 1 ]; do
    $SCRIPTPATH/server.py --production --websocket_port=8014
    sleep 5
done
