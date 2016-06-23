import sys, os

class PageInfoMain:
    def __init__(self, DBCONN, version):
        self.DBCONN = DBCONN
        self.version = version

    def wholePage(self):
        return {"page": {"version" : self.version,
                         "title" : "Regulatory Element Visualizer"},
                "version" : self.version }
