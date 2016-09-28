import os
import sys
import argparse

sys.path.append(os.path.join(os.path.dirname(__file__),
                             "../../common"))
from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper
from constants import paths, chroms

sys.path.append("../../../metadata/utils")
from db_utils import getcursor

def parseargs():
    parser = argparse.ArgumentParser()
    parser.add_argument('--refresh_re', action="store_true", default=False)
    parser.add_argument('--refresh', action="store_true", default=False)
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--version', type=int, default=4)
    parser.add_argument('--assembly', type=str, default="hg19")
    args = parser.parse_args()
    return args

def main():
    args = parseargs()
    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    pg = PostgresWrapper(DBCONN)

    re_json_orig = paths.get_paths(args.version, chroms[args.assembly])["origFnp"]
    
    if args.refresh_re:
        print("creating RE tables...")
        n_re = pg.recreate_re_tables(re_json_orig)
        print("inserted %d REs" % n_re)
    
    if args.refresh:
        pg.refresh_all_mvs()
    else:
        pg.recreate_all_mvs()

    return 0

if __name__ == "__main__":
    sys.exit(main())
