import sys
import os

from models.input_data import InputData

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from config import Config


class InputDataWebServiceWrapper:
    def __init__(self, ps):
        self.ps = ps
        
    def process(self, args, kwargs):
        d = InputData(self.ps)
        return d.main()
