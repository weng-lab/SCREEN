from __future__ import print_function
import sys
import time
import math

def printr(s):
    print(s, end="\r")
    sys.stdout.flush()

def printt(s):
    print("%s %s" % (time.strftime("%m/%d/%Y %H:%M:%S"), s))

def n_digits(n):
    return 1 if n == 0 else int(math.floor(math.log10(n)) + 1)

def pad_space(n, d):
    digits = n_digits(n)
    if digits >= d: return str(n)
    retval = str(n)
    for i in range(0, d - digits): retval = " " + retval
    return retval

class ParallelCounter:
    def __init__(self, x = 0):
        self.x = x
    def inc(self):
        self.x += 1
