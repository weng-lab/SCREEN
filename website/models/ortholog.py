import os, sys

sys.path.append(os.path.join(os.path.realpath(__file__), "../../../metadata/utils"))
from db_utils import getcursor

class Ortholog:
    def __init__(self, assembly, DBCONN, acc):
        self.DBCONN = DBCONN
        self.assembly = assembly
        self.acc = acc
        self.species = {"ortholog": "mouse" if assembly != "mm10" else "human",
                        "current":  "mouse" if assembly == "mm10" else "human" }
        self.tablename = "mm10_liftover"
        
        with getcursor(DBCONN, "ortholog$Ortholog::__init__") as curs:
            curs.execute("""SELECT chrom, start, stop, {ospecies}Accession, overlap
                            FROM {tablename}
                            WHERE {cspecies}Accession = '{acc}'""".format(acc=acc, cspecies=self.species["current"],
                                                                          ospecies=self.species["ortholog"], tablename=self.tablename))
            self.dbresults = curs.fetchall()

    def as_dict(self):
        if not self.dbresults:
            return []
        return [{"chrom": dbresult[0],
                "start": dbresult[1],
                "stop": dbresult[2],
                "accession": dbresult[3],
                "overlap": dbresult[4]} for dbresult in self.dbresults]
