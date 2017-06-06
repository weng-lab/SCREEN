from __future__ import print_function

import sys, os

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../1_pipeline/06_fantomcat"))
from common import FCPaths

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from pgglobal import GlobalPG

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor

def main():
    DBCONN = db_connect(os.path.realpath(__file__))

    with getcursor(DBCONN, "26_globalobjects$main") as curs:
        g = GlobalPG("hg19")
        g.drop_and_recreate(curs)
        g.doimport([("fantomcat", FCPaths.global_statistics)],
                   curs)
        print(g.select("fantomcat", curs))
    return 0

if __name__ == "__main__":
    sys.exit(main())
                
