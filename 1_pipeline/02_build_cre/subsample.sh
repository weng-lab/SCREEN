#!/bin/bash

zcat $1 | awk 'BEGIN {srand()} !/^$/ { if (rand() <= .01) print $0}' | gzip >  sample/$1
