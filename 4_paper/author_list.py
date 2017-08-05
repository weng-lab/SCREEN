#!/usr/bin/env python3

from __future__ import print_function

import os, sys, argparse, json, hashlib
from itertools import groupby
from collections import namedtuple

Author = namedtuple('Author', "firstName midInitial lastName email lab labGroup order coAuthOrder lastAuthNum".split(' '))

class AuthorList:
    def __init__(self, args):
        self.args = args

    def _loadSheet(self, sheetName):
        import gspread
        from oauth2client.service_account import ServiceAccountCredentials
        # http://www.tothenew.com/blog/access-and-modify-google-sheet-using-python/
        scope = "https://spreadsheets.google.com/feeds"
        fnp = os.path.join(os.path.dirname(__file__), ".client_secret.json")
        credentials = ServiceAccountCredentials.from_json_keyfile_name(fnp, scope)
        gs = gspread.authorize(credentials)
        gsheet = gs.open("ENCODE3 Paper Author List Source List (Purcaro)")

        print("***************", sheetName)
        wsheet = gsheet.worksheet(sheetName)
        numRows = 1
        for cell in  wsheet.range('A2:A' + str(wsheet.row_count)):
            if cell.value > "":
                numRows += 1
        print("numRows", numRows, "(including header)")

        def getCol(letter, isInt = False):
            col = wsheet.range('{c}2:{c}{nr}'.format(c=letter, nr=numRows))
            col = [x.value.rstrip() for x in col]
            if isInt:
                return [int(x) if x else 0 for x in col]
            return col

        firstNames = getCol('A')
        midInitials = getCol('B')
        lastNames = getCol('C')
        emails = getCol('D')
        labs = getCol('I')
        labGroups = getCol('H')
        orders = getCol('K', True)
        coAuthOrders = getCol('N', True)
        lastAuthNums = getCol('O', True)
        
        m = zip(firstNames, midInitials, lastNames, emails, labs, labGroups,
                orders, coAuthOrders, lastAuthNums)
        return [Author(*x) for x in m]

    def _output(self, outArrays):
        for labGroupLab, names, people in outArrays:
            print('\n' + labGroupLab[0], '--', labGroupLab[1])
            print('; '.join(names))
    
    def run(self):
        authors = self._loadSheet("BigList")
        outArrays = self.organizeAuthors(authors)
        self._output(outArrays)
        
    def organizeAuthors(self, authors):
        numAuthors = 0

        def sorter(x):
            return [x.labGroup, x.lab]
        authors.sort(key = sorter)

        outArrays = []

        firstAuthors = [["co-first authors", ""], [], []]
        lastAuthors = [["last authors", ""], [], []]
        
        for labGroupLab, people in groupby(authors, sorter):
            people = sorted(list(people),
                            key = lambda x: [x.order, x.lastName, x.firstName,
                                             x.midInitial])
            names = []
            for a in people:
                n = a.lastName + ', ' + a.firstName
                if a.midInitial:
                    n += ' ' + a.midInitial
                    if not n.endswith('.'):
                        n += '.'
                if a.coAuthOrder:
                    firstAuthors[1].append(n)
                    firstAuthors[2].append(a)
                    numAuthors += 1
                elif a.lastAuthNum:
                    lastAuthors[1].append(n)
                    lastAuthors[2].append(a)
                    numAuthors += 1
                else:
                    names.append(n)
            outArrays.append([labGroupLab, names, people])
            numAuthors += len(names)
        print("found", numAuthors, "author names")
        outArrays.insert(0, firstAuthors)
        outArrays.append(lastAuthors)
        return outArrays
        
def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    s = AuthorList(args)
    s.run()

if __name__ == "__main__":
    sys.exit(main())
