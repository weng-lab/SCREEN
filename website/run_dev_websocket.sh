#!/bin/sh

SCRIPT=`realpath $0`
SCRIPTPATH=`dirname $SCRIPT`

while [ 1 ]; do
    $SCRIPTPATH/webservice_server.py --local --port=9007;
    sleep 5s;
done
