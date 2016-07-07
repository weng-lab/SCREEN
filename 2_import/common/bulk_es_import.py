import argparse
sys.path.append("../../common")
from es_bulk_importer import ESBulkImporter

class executable_importer:

    def __init__(self, fnp, index, doc_type):
        self.fnp = fnp
        self._init_argparser()
    
    def _init_argparser(self):
        self.parser = argparse.ArgumentParser()
        self.parser.add_argument('--rootpath', type=str, default="../../data/")
        self.parser.add_argument("--elasticsearch_server", type=str, default="127.0.0.1")
        self.parser.add_argument('--elasticsearch_port', type=int, default=9200)
        self.parser.add_argument('--debug', action="store_true", default=False)

    def exe(self):
        args = self.parser.parse_args()
        importer = ESBulkImporter(args.elasticsearch_server, args.elasticsearch_port)
        try:
            importer.do_import(fnp, index, doc_type=doc_type)
        except:
            if args.debug: raise
            return 1
        return 0
