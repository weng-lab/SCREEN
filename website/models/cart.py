import os, sys, json
from collections import defaultdict

class Cart:
    def __init__(self, es, ps, guid):
        self.es = es
        self.ps = ps

    def get(self):
        
