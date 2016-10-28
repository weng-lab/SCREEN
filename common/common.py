#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import time
import math

def screenWidth():
    # http://stackoverflow.com/a/943921
    rows, columns = os.popen('stty size', 'r').read().split()
    return int(columns)

def printr(*args):
    s = " ".join([str(x) for x in args])
    s += " " * (screenWidth() - len(s))
    print(s, end="\r")
    sys.stdout.flush()

def printt(*args):
    print(time.strftime("%m/%d/%Y %H:%M:%S") + "\t", *args)

def n_digits(n):
    return 1 if n == 0 else int(math.floor(math.log10(n)) + 1)

def pad_space(n, d):
    digits = n_digits(n)
    if digits >= d: return str(n)
    return " " * (d - digits) + str(n)

class ParallelCounter:
    def __init__(self, x = 0):
        self.x = x
    def inc(self):
        self.x += 1

def main():
    printt("a", 1, [])
    print(pad_space(1, 0))
    print(pad_space(1, 2))
    print(pad_space(1, 5))
    print(pad_space(1, 10))

if __name__ == '__main__':
    sys.exit(main())
