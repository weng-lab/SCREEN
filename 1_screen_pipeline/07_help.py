#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import argparse
from oauth2client import tools
import json

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor
from utils import AddPath, printt, Utils

AddPath(__file__, '../common/')
from constants import helptext, paths

AddPath(__file__, "../googleapi")
from helptext import GoogleDocs


class HelpTextImport:
    def __init__(self, args):
        self.args = args

    def run(self):
        # download GoogleDoc
        self.data = GoogleDocs(self.args).getcontents(helptext.docid).split("\n")

        # only reset DB if valid helptext was downloaded
        if len(self.data) == 0:
            print("no help text could be downloaded; please check GoogleDoc contents at https://docs.google.com/document/d/%s" % helptext.docid)
            return 1

        self._parse()
        self._save()

    def _parse(self):
        """
          " load from the cached Google Doc and parse
          " file format is:
          "
          " @key
          " # comment
          " %title
          " help_text
        """
        key = None
        help_text = ""
        title = ""

        rows = []
        for line in self.data:
            if line.startswith('@'):
                if key and help_text:
                    if not title:
                        print("error: missing title for", key)
                    rows.append((key, title, help_text.strip()))
                key = line.strip()[1:]
                help_text = ""
                title = ""
            elif line.startswith("%"):
                title = line.replace("%", "").strip()
            elif not line.startswith("#"):
                help_text += line.strip() + "\n"
        if key and help_text:
            if not title:
                print("error: missing title for", key)
            rows.append((key, title, help_text.strip()))

        self.rows = filter(lambda x: not x[0].startswith("key: a specific key"),
                           rows)

    def _save(self):
        keys = [r[0] for r in self.rows]
        print('\n'.join(keys))

        # from http://stackoverflow.com/a/30985541
        records_list_template = ','.join(['%s'] * len(self.rows))

        fnp = paths.path('', "extras", "google-help-text.json")
        Utils.ensureDir(fnp)
        j = {"records_list_template": records_list_template,
             "rows": self.rows}
        with open(fnp, 'w') as f:
            json.dump(j, f)
        print("wrote", fnp)


def run(args, DBCONN):
    printt('***********')
    hti = HelpTextImport(args)
    return hti.run()


def parse_args():
    parser = argparse.ArgumentParser(parents=[tools.argparser])
    return parser.parse_args()


def main():
    args = parse_args()

    return run(args, None)


if __name__ == "__main__":
    sys.exit(main())
