#!/usr/bin/env python2

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function

import os
import sys
import argparse

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor
from utils import AddPath, printt

AddPath(__file__, '../common/')
from dbconnect import db_connect
from config import Config


class DbTrackhub:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN
        self.tableSearch = "search"

    def setupDB(self):
        with getcursor(self.DBCONN, "setupDB") as curs:
            curs.execute("""
DROP TABLE IF EXISTS {search};
CREATE TABLE {search}
(id serial PRIMARY KEY,
reAccession text,
assembly text,
uid text NOT NULL,
hubNum integer NOT NULL,
j jsonb
) """.format(search=self.tableSearch))

def run(args, DBCONN):
    d = DbTrackhub(DBCONN)
    d.setupDB()


def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)


if __name__ == '__main__':
    main()
