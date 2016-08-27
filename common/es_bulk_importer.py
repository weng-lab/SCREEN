import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils

class ESBulkImporter:
    def __init__(self, server_address, server_port, use_https = False,
                 n_workers = 4, batch_size = 1000):
        self.server = "http%s://%s:%d" % ("s" if use_https else "",
                                          server_address,
                                          server_port)
        self.n_workers = n_workers
        self.batch_size = batch_size

    def do_import(self, fnp, index, doc_type = "default",
                  purge_existing = True, verbose = True, unzip_on_fly = False):
        if fnp.endswith(".gz"):
            unzip_on_fly = True
        cmds = ["/usr/sbin/esbulk",
                "-server", self.server,
                "-index", index,
                "-type", doc_type]
        
        if purge_existing: cmds.append("-purge")
        if verbose: cmds.append("-verbose")
        if self.n_workers != 4: cmds += ["-w", str(self.n_workers)]
        if self.batch_size != 1000: cmds += ["-size", str(self.batch_size)]
        if unzip_on_fly: cmds.append("-z")
        cmds.append(fnp)
        
        Utils.runCmds(cmds, verbose=verbose)
