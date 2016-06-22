import sys, os

class PageInfoMain:
    def __init__(self, DBCONN, species, version):
        self.DBCONN = DBCONN
        self.species = species
        self.version = version

    def wholePage(self):
        humanVersion = self.version.replace("mouse", "human")
        mouseVersion = self.version.replace("human", "mouse")
        return {"page": {"species" : self.species,
                         "version" : self.version,
                         "humanVersion" : humanVersion,
                         "mouseVersion" : mouseVersion,
                         "title" : "Regulatory Element Visualizer"},
                "version" : self.version }
