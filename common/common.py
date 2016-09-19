from __future__ import print_function
import sys

def printr(s):
    print(s, end="\r")
    sys.stdout.flush()
