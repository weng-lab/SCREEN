import os
import sys

sys.path.append("../../metadata/utils")
from utils import Utils

class ESBulkImporter:
    def __init__(self, server_address, server_port, use_https = False,
                 n_workers = 4, batch_size = 1000, unzip_on_fly = False):
        self.server = "http%s://%s:%d" % ("s" if use_https else "", server_address, server_port)
        self.n_workers = n_workers
        self.batch_size = batch_size
        self.unzip_on_fly = unzip_on_fly
        
    def do_import(self, fnp, index, doc_type = "default", purge_existing = True, verbose = True):
        cmds = ["esbulk", fnp, "-server", self.server,
                "-index", index, "-type", doc_type]
        if purge_existing: cmds.append("-purge")
        if verbose: cmds.append("-verbose")
        if self.n_workers != 4: cmds += ["-w", str(self.n_workers)]
        if self.batch_size != 1000: cmds += ["-size", str(self.batch_size)]
        if self.unzip_on_fly: cmds.append("-z")
        Utils.runCmds(cmds, verbose=verbose)
