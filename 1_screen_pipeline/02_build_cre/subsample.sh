#!/bin/bash

DIR=$(dirname $1)
FN=$(basename $1)

zcat $1 | awk 'BEGIN {srand()} !/^$/ { if (rand() <= .01) print $0}' | gzip >  $DIR/sample/$FN
