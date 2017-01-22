#!/usr/bin/env python

from __future__ import print_function
import argparse

regelms = __import__('01_regelms')
pg_cre =  __import__('02_pg_cre')
cellTypeInfo = __import__('03_cellTypeInfo')
genealiases = __import__('04_genealiases')
snps =  __import__('05_snps')
correlate =  __import__('06_correlate')
de =  __import__('07_de')
gwas =  __import__('08_gwas')
liftover =  __import__('09_liftover')
peakIntersections =  __import__('10_peakIntersections')
tads =  __import__('11_tads')



def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)



    return 0

if __name__ == '__main__':
    main()
