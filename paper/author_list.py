#!/usr/bin/env python3

from __future__ import print_function

import os
import sys
import argparse
import json
import hashlib
from itertools import groupby
from collections import namedtuple, OrderedDict

import gspread
from oauth2client.service_account import ServiceAccountCredentials

with open('nature_allowed_coutnries.txt') as f:
    Countries = set([x.strip() for x in f])


class Author:
    def __init__(self, firstName, midInitial, lastName, email, email2, lab, labGroup,
                 order, coAuthOrder, lastAuthNum, address, institue, country,
                 address2, address3, subLab):
        self.firstName = firstName
        self.midInitial = midInitial.strip()
        self.lastName = lastName
        self.email = email
        self.email2 = email2
        self.lab = lab
        self.labGroup = labGroup
        self.order = order
        self.coAuthOrder = coAuthOrder
        self.lastAuthNum = lastAuthNum
        self.address = address
        self.institue = institue
        self.address2 = address2
        self.address3 = address3

        self.subLab = subLab
        if not subLab:
            self.subLab = lab

        if not self.midInitial.endswith('.') and 1 == len(self.midInitial):
            self.midInitial += '.'

        cFix = {"USA": "United States",
                "UK": "United Kingdom",
                "CH": "Switzerland"}
        c = cFix.get(country, country)
        if c not in Countries:
            raise Exception("missing " + c)
        self.country = c

    def toName(self):
        n = self.firstName + ' '
        if self.midInitial:
            n += self.midInitial + ' '
        n += self.lastName
        return n

    def isFirstOrLastAuthor(self):
        return self.coAuthOrder or self.lastAuthNum

    def toNatureJson(self):
        return {"firstName": self.firstName,
                "middleName": self.midInitial,
                "lastName": self.lastName,
                "email": self.email,
                "org": self.institue,
                "country": self.country}


class AuthorList:
    def __init__(self, args):
        self.args = args

    def _loadGroups(self, sheetName):
        scope = "https://spreadsheets.google.com/feeds"
        fnp = os.path.join(os.path.dirname(__file__), ".client_secret.json")
        credentials = ServiceAccountCredentials.from_json_keyfile_name(fnp, scope)
        gs = gspread.authorize(credentials)
        gsheet = gs.open("ENCODE3 Paper Author List Source List (Purcaro)")

        print("***************", sheetName, "<br>")
        wsheet = gsheet.worksheet(sheetName)
        numRows = 1
        for cell in wsheet.range('A2:A' + str(wsheet.row_count)):
            if cell.value > "":
                numRows += 1
        print("numRows", numRows, "(including header)", "<br>")

        def getCol(letter, isInt=False):
            col = wsheet.range('{c}2:{c}{nr}'.format(c=letter, nr=numRows))
            col = [x.value.strip() for x in col]
            if isInt:
                return [int(x) if x else 0 for x in col]
            return col

        encodeGroups = getCol('A')
        piNames = getCol('B')
        orders = getCol('C', True)
        groupTitles = getCol('D')
        descs = getCol('E')

        self.labOrder = {}
        self.labTitle = {}
        for eg, pi, order, title, desc in zip(encodeGroups, piNames, orders, groupTitles, descs):
            k = (eg, pi)
            self.labOrder[k] = order
            self.labTitle[order] = "{title} ({desc})".format(title=title, desc=desc)

    def _loadSheet(self, sheetName):
        # http://www.tothenew.com/blog/access-and-modify-google-sheet-using-python/
        scope = "https://spreadsheets.google.com/feeds"
        fnp = os.path.join(os.path.dirname(__file__), ".client_secret.json")
        credentials = ServiceAccountCredentials.from_json_keyfile_name(fnp, scope)
        gs = gspread.authorize(credentials)
        gsheet = gs.open("ENCODE3 Paper Author List Source List (Purcaro)")

        print("***************", sheetName, "<br>")
        wsheet = gsheet.worksheet(sheetName)
        numRows = 1
        for cell in wsheet.range('A2:A' + str(wsheet.row_count)):
            if cell.value > "":
                numRows += 1
        print("numRows", numRows, "(including header)", "<br>")

        def getCol(letter, isInt=False):
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
        addresses = getCol('L')
        institues = getCol('M')
        countries = getCol('N')
        addresses2 = getCol('O')
        addresses3 = getCol('P')
        emails2 = getCol('Q')
        subLabs = getCol('R')
        coAuthOrders = getCol('S', True)
        lastAuthNums = getCol('T', True)

        m = zip(firstNames, midInitials, lastNames, emails, emails2, labs,
                labGroups, orders, coAuthOrders, lastAuthNums, addresses,
                institues, countries, addresses2, addresses3,
                subLabs)
        return [Author(*x) for x in m]

    def addr(self, p):
        k = p.address
        if k not in self.addressToIdx:
            self.addressToIdx[k] = self.addressToIdxCounter
            self.addressToIdxCounter += 1

        superNum = self.addressToIdx[k]
        n = p.toName() + '<sup>' + str(superNum)

        if p.address2:
            k = p.address2
            if k not in self.addressToIdx:
                self.addressToIdx[k] = self.addressToIdxCounter
                self.addressToIdxCounter += 1
            superNum = self.addressToIdx[k]
            n += ',' + str(superNum)

        if p.address3:
            k = p.address3
            if k not in self.addressToIdx:
                self.addressToIdx[k] = self.addressToIdxCounter
                self.addressToIdxCounter += 1
            superNum = self.addressToIdx[k]
            n += ',' + str(superNum)

        n += '</sup>'

        return n

    def makeList(self, labGroupLab, people, coauth):
        print("<br>")
        print("<b>", labGroupLab, "</b>", "<br>")
        toShow = []
        for p in people:
            n = self.addr(p)
            toShow.append(n)
            if coauth:
                toShow[-1] += '*'
            if False and lastIdx == counter:
                toShow[-1] += '&'
        print(', '.join(toShow), "<br>")

    def _output(self, firstAuthors, allAuthors, lastAuthors):
        self.addressToIdxCounter = 1
        self.addressToIdx = OrderedDict()

        self.makeList(firstAuthors[0], firstAuthors[1], True)
        print(", The ENCODE Consortium,")
        self.makeList(lastAuthors[0], lastAuthors[1], False)

        print("****************************", "<br>")
        for labGroupLab, people in allAuthors:
            self.makeList(labGroupLab, people, False)

        print("<br>", "Affiliations", "<br>")
        for k, v in self.addressToIdx.items():
            print(v, k, "<br>")

    def _outputJson(self, firstAuthors, allAuthors, lastAuthors):
        r = []
        emails = set()
        for p in firstAuthors[1]:
            if p.email not in emails:
                emails.add(p.email)
                r.append(p.toNatureJson())
        for p in lastAuthors[1]:
            if "Zhiping" == p.firstName and "Weng" == p.lastName:
                r.insert(0, p.toNatureJson())
            else:
                if p.email not in emails:
                    emails.add(p.email)
                    r.append(p.toNatureJson())
        for labGroupLab, people in allAuthors:
            for p in people:
                if not p.isFirstOrLastAuthor():
                    if p.email not in emails:
                        emails.add(p.email)
                        r.append(p.toNatureJson())
        for idx, e in enumerate(r):
            e["idx"] = idx + 1
        fnp = "/home/mjp/Dropbox/Final-Images/authors.json"
        with open(fnp, 'w') as f:
            json.dump(r, f)
        print("wrote", fnp)

    def run(self):
        groups = self._loadGroups("LabOrder")
        authors = self._loadSheet("BigList")
        firstAuthors, allAuthors, lastAuthors = self.organizeAuthors(authors)
        self._outputJson(firstAuthors, allAuthors, lastAuthors)
        self._output(firstAuthors, allAuthors, lastAuthors)

    def organizeAuthors(self, authors):
        numAuthors = 0

        def sorter(x):
            return [self.labOrder[(x.labGroup, x.lab)], x.labGroup, x.lab]
        authors.sort(key=sorter)

        allAuthors = []

        firstAuthors = [["co-first authors", ""], []]
        lastAuthors = [["last authors", ""], []]

        def peopleOrder(x):
            return [x.order, x.lastName, x.firstName, x.midInitial]

        def coFirstOrder(x):
            return [x.coAuthOrder, x.lastName, x.firstName, x.midInitial]

        def coLastOrder(x):
            return [x.lastAuthNum, x.lastName, x.firstName, x.midInitial]

        for labGroupLab, people in groupby(authors, sorter):
            people = sorted(list(people), key=peopleOrder)
            for a in people:
                if a.coAuthOrder:
                    firstAuthors[1].append(a)
                elif a.lastAuthNum:
                    lastAuthors[1].append(a)
            allAuthors.append([self.labTitle[labGroupLab[0]], people])
            numAuthors += len(people)
        print("found", numAuthors, "author names")

        firstAuthors[1].sort(key=coFirstOrder)
        lastAuthors[1].sort(key=coLastOrder)

        return firstAuthors, allAuthors, lastAuthors


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
