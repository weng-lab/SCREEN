import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from dbs import DBS
from db_utils import getcursor

class PostgresWrapper:

    def __init__(self, DBCONN):
        self.DBCONN = DBCONN
        self.assays = ["dnase", "tf", "histone"]
        self.chroms = {}
        self.chroms['hg19'] = ['chr1', 'chr10', 'chr11', 'chr12', 'chr13',
                               'chr14', 'chr15', 'chr16', 'chr17', 'chr18',
                               'chr19', 'chr2', 'chr20', 'chr21', 'chr22',
                               'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8',
                               'chr9', 'chrM', 'chrX', 'chrY']
        self.chroms['mm10'] = ['chr1', 'chr10', 'chr11', 'chr12', 'chr13',
                               'chr14', 'chr15', 'chr16', 'chr17', 'chr18',
                               'chr19', 'chr2',
                               'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8',
                               'chr9', 'chrM', 'chrX', 'chrY']

    def findBedOverlapAllAssays(self, assembly, chrom, start, end):
        return self.findBedOverlap("dnase", assembly, chrom, start, end) + self.findBedOverlap("tf", assembly, chrom, start, end) + self.findBedOverlap("histone", assembly, chrom, start, end)
    
    def findBedOverlap(self, assay, assembly, chrom, start, end):
        if assembly not in ["hg19", "mm10"]:
            print("PostgresWrapper: findBedOverlap: bad assembly", assembly)
            return []
        if chrom not in self.chroms[assembly]:
            print("PostgresWrapper: findBedOverlap: bad chrom", chrom)
            return []
        if assay not in self.assays:
            print("PostgresWrapper: findBedOverlap: bad assay", assay)
            return []
        tableName = "bed_ranges_{assembly}_{assay}_{chrom}".format(
            assembly = assembly, assay=assay, chrom=chrom)

        with getcursor(self.DBCONN, "findBedOverlap") as curs:
            curs.execute("""
            SELECT DISTINCT file_accession
            FROM {tableName}
            WHERE startend && int4range(%(start)s, %(end)s)
            """.format(tableName = tableName), {"start": start, "end": end})
            return [x[0] for x in curs.fetchall()]
