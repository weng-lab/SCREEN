import argparse
import sys
import os

from es_bulk_importer import ESBulkImporter

class executable_importer:

    def __init__(self, fnp, index, doc_type):
        self.fnp = fnp
        self.index = index
        self.doc_type = doc_type
        self._init_argparser()

    def _init_argparser(self):
        self.parser = argparse.ArgumentParser()
        self.parser.add_argument('--rootpath', type=str, default="../../data/")
        self.parser.add_argument("--elasticsearch_server", type=str, default="127.0.0.1")
        self.parser.add_argument('--elasticsearch_port', type=int, default=9200)
        self.parser.add_argument('--debug', action="store_true", default=True)

    def exe(self):
        args = self.parser.parse_args()
        importer = ESBulkImporter(args.elasticsearch_server,
                                  args.elasticsearch_port)
        try:
            importer.do_import(self.fnp, self.index, doc_type=self.doc_type)
        except:
            raise
