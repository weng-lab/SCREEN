import os
import sys

sys.path.append(os.path.join(os.path.realpath(__file__), "../../../metadata/utils"))
from db_utils import getcursor


class Ortholog:
    def __init__(self, assembly, DBCONN, acc, other):
        self.DBCONN = DBCONN
        self.assembly = assembly
        self.acc = acc
        self.tablename = assembly + "_liftover_" + other

        with getcursor(DBCONN, "ortholog$Ortholog::__init__") as curs:
            curs.execute("""SELECT chrom, start, stop, otherAccession
                            FROM {tablename}
                            WHERE thisAccession = '{acc}'""".format(acc=acc,
                                                                    tablename=self.tablename))
            self.dbresults = curs.fetchall()

    def as_dict(self):
        if not self.dbresults:
            return []
        return [{"chrom": dbresult[0],
                 "start": dbresult[1],
                 "stop": dbresult[2],
                 "accession": dbresult[3]} for dbresult in self.dbresults]
