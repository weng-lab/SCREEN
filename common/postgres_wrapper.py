#!/usr/bin/env python3

import sys
import os
import gzip
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from dbs import DBS
from db_utils import getcursor

from dbconnect import db_connect
from constants import chroms


class PostgresWrapper:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN
