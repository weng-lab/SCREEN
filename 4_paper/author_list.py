#!/usr/bin/env python

from __future__ import print_function

import os, sys, argparse, json, hashlib
from itertools import groupby
from collections import namedtuple

Author = namedtuple('Author', "firstName midInitial lastName email lab labGroup order".split(' '))

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

            def getCol(letter, isInt = False):
                col = wsheet.range('{c}2:{c}{nr}'.format(c=letter, nr=numRows))
                col = [x.value for x in col]
                if isInt:
                    ret = []
                    return [int(x) if x else 0 for x in col]
                return col
            
            firstNames = getCol('A')
            midInitials = getCol('B')
            lastNames = getCol('C')
            emails = getCol('D')
            labs = getCol('I')
            labGroups = getCol('H')
            orders = getCol('K', True)
            
            m = zip(firstNames, midInitials, lastNames, emails, labs, labGroups, orders)
            authors = [Author(*x) for x in m]
            
            def sorter(x):
                return [x.labGroup, x.lab]

            authors.sort(key = sorter)
            for labGroupLab, people in groupby(authors, sorter):
                people = sorted(list(people),
                                key = lambda x: [x.order, x.lastName, x.firstName,
                                                 x.midInitial])
                print('\n' + labGroupLab[0], '--', labGroupLab[1])
                names = []
                for a in people:
                    n = a.lastName + ', ' + a.firstName
                    if a.midInitial:
                        n += ' ' + a.midInitial + '.'
                    names.append(n)
                print('; '.join(names))
                                
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
