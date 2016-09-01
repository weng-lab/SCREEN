import argparse
import sys
import os

from es_bulk_importer import ESBulkImporter

class executable_importer:

    def __init__(self, fnp, index, doc_type,
                 elasticsearch_server = "127.0.0.1",
                 elasticsearch_port = 9200):
        self.fnp = fnp
        self.index = index
        self.doc_type = doc_type
        self.elasticsearch_server = elasticsearch_server
        self.elasticsearch_port = elasticsearch_port

    def exe(self):
        importer = ESBulkImporter(self.elasticsearch_server,
                                  self.elasticsearch_port)
        try:
            importer.do_import(self.fnp, self.index, doc_type=self.doc_type)
        except:
            raise
