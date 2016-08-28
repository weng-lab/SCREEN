#!/usr/bin/env python
import sys, os
import ConfigParser

class V4Config:
    fnp = os.path.join(os.path.dirname(__file__), "../config.ini")
    
    c = ConfigParser.ConfigParser()
    c.read(fnp)

    re_version = c.getint("RE", "version")
