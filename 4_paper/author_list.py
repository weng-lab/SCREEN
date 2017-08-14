#!/usr/bin/env python3

from __future__ import print_function

import os, sys, argparse, json, hashlib
from itertools import groupby
from collections import namedtuple, OrderedDict

import gspread
from oauth2client.service_account import ServiceAccountCredentials

class Author:
    def __init__(self, firstName, midInitial, lastName, email, lab, labGroup,
                 order, coAuthOrder, lastAuthNum, subLab):
        self.firstName = firstName
        self.midInitial = midInitial
        self.lastName = lastName
        self.email = email
        self.lab = lab
        self.labGroup = labGroup
        self.order = order
        self.coAuthOrder = coAuthOrder
        self.lastAuthNum = lastAuthNum

        self.subLab = subLab
        if not subLab:
            self.subLab = lab
        
    def toName(self):
        n = self.firstName + ' '
        if self.midInitial:
            n += self.midInitial
            if not n.endswith('.') and len(self.midInitial) > 1:
                n += '.'
            n += ' '
        n += self.lastName
        return n

class AuthorList:
    def __init__(self, args):
        self.args = args
        
    def _loadSheet(self, sheetName):
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
            col = [x.value.strip() for x in col]
            if isInt:
                return [int(x) if x else 0 for x in col]
            return col

        firstNames = getCol('A')
        midInitials = getCol('B')
        lastNames = getCol('C')
        emails = getCol('D')
        labGroups = getCol('H')
        labs = getCol('I')
        orders = getCol('K', True)
        subLabs = getCol('M')
        coAuthOrders = getCol('N', True)
        lastAuthNums = getCol('O', True)
        
        m = zip(firstNames, midInitials, lastNames, emails, labs, labGroups,
                orders, coAuthOrders, lastAuthNums, subLabs)
        return [Author(*x) for x in m]

    def _output(self, outArrays):
        labGroupLabToIdxCounter = 1
        labGroupLabToIdx = OrderedDict()

        counter = 0
        lastIdx = len(outArrays) - 1
        for labGroupLab, people in outArrays:
            print('\n' + labGroupLab[0], '--', labGroupLab[1])
            toShow = []
            for p in people:
                k = p.subLab
                if k not in labGroupLabToIdx:
                    labGroupLabToIdx[k] = labGroupLabToIdxCounter
                    labGroupLabToIdxCounter += 1
                superNum = labGroupLabToIdx[k]
                n = p.toName() + str(superNum)
                toShow.append(n)
                if 0 == counter:
                    toShow[-1] += '*'
                if False and lastIdx == counter:
                    toShow[-1] += '&'
            if lastIdx == counter:
                print(', '.join(toShow[:-1]), '&', toShow[-1])
            else:
                print(', '.join(toShow))
            counter += 1

        print('\nlabs')
        for k, v in labGroupLabToIdx.items():
            print(k, v)
            
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

        firstAuthors = [["co-first authors", ""], []]
        lastAuthors = [["last authors", ""], []]

        def peopleOrder(x):
            return [x.order, x.lastName, x.firstName, x.midInitial]
        def coFirstOrder(x):
            return [x.coAuthOrder, x.lastName, x.firstName, x.midInitial]
        def coLastOrder(x):
            return [x.lastAuthNum, x.lastName, x.firstName, x.midInitial]
                
        for labGroupLab, people in groupby(authors, sorter):
            people = sorted(list(people), key = peopleOrder)
            names = []
            for a in people:
                if a.coAuthOrder:
                    firstAuthors[1].append(a)
                elif a.lastAuthNum:
                    lastAuthors[1].append(a)
                names.append(a)
            outArrays.append([labGroupLab, names])
            numAuthors += len(names)
        print("found", numAuthors, "author names")

        firstAuthors[1].sort(key = coFirstOrder)
        outArrays.insert(0, firstAuthors)

        lastAuthors[1].sort(key = coLastOrder)
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
