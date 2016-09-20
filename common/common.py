from __future__ import print_function
import sys
import time

def printr(s):
    print(s, end="\r")
    sys.stdout.flush()

def printt(s):
    print("%s %s" % (time.strftime("%m/%d/%Y %H:%M:%S"), s))
