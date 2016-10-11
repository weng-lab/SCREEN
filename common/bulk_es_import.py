import argparse
import sys
import os

from es_bulk_importer import ESBulkImporter

class executable_importer:

    def __init__(self, fnps, index, doc_type,
                 elasticsearch_server = "127.0.0.1",
                 elasticsearch_port = 9200):
        self.fnps = [fnps] if type(fnps) is str else fnps
        self.index = index
        self.doc_type = doc_type
        self.elasticsearch_server = elasticsearch_server
        self.elasticsearch_port = elasticsearch_port

    def exe(self, batch_size = 1000):
        importer = ESBulkImporter(self.elasticsearch_server,
                                  self.elasticsearch_port,
                                  batch_size = batch_size)
        for i in range(0, len(self.fnps)):
            importer.do_import(self.fnps[i], self.index, doc_type=self.doc_type,
                               purge_existing = (i == 0))
        
