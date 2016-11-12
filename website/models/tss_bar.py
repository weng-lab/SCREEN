import os, sys

class TSSBarGraph:
    def __init__(self, _list):
        self._list = _list

    def format(self):
        return [{"key": int(k.split("-")[1].split(".")[0]) if len(k.split("-")) > 1 and k.split("-")[1] != "*" else 1e12,
                "value": v} for k, v in self._list["datapairs"].iteritems()]
