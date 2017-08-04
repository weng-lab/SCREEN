#!/usr/bin/env python

from __future__ import print_function

import os, sys, argparse, json, hashlib
from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), '../utils'))
from exp import Exp
from querydcc import QueryDCC
from utils import Utils, printt
from cache_memcache import MemCacheWrapper

class AuthorList:
    def __init__(self, args):
        self.args = args
        
    def run(self):
        import gspread
        from oauth2client.service_account import ServiceAccountCredentials
        # http://www.tothenew.com/blog/access-and-modify-google-sheet-using-python/
        scope = "https://spreadsheets.google.com/feeds"
        fnp = os.path.join(os.path.dirname(__file__), ".client_secret.json")
        credentials = ServiceAccountCredentials.from_json_keyfile_name(fnp, scope)
        gs = gspread.authorize(credentials)
        gsheet = gs.open("ENCODE3 Paper Author List Source List")

        
        sheetNames = ["BigList"]
        for sheetName in sheetNames:
            print("***************", sheetName)
            wsheet = gsheet.worksheet(sheetName)
            numRows = 1
            for cell in  wsheet.range('A2:A' + str(wsheet.row_count)):
                if cell.value > "":
                    numRows += 1
            print("numRows", numRows)

            def getcol(letter):
                col = wsheet.range('{c}2:{c}{nr}'.format(c=letter, nr=numRows))
                return [x.value for x in col]

            firstNames = getcol('A')
            lastNames = getcol('C')
            emails = getcol('D')
            pis = getcol('I')

            for fn, ln, email, pi in zip(firstNames, lastNames, emails, pis):
                print(pi, ln, fn)
                                
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cache', action="store_true", default=False)
    parser.add_argument('--force_resubmit', action="store_true", default=False)
    parser.add_argument('--patch', action="store_true", default=False)
    parser.add_argument('--debug', action="store_true", default=False)
    parser.add_argument('--real', action="store_true", default=False)
    parser.add_argument('--host', action="store_true",
                        default="https://test.encodedcc.org")
    parser.add_argument('--keyFnp', action="store_true",
                        default=os.path.expanduser('~/.encode.txt'))
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    s = AuthorList(args)
    s.run()

if __name__ == "__main__":
    sys.exit(main())
