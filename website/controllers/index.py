#!/usr/bin/python

class MainIndexController:
    def __init__(self, templates):
        self.templates = templates

    def Index(self):
        return self.templates('index',
                              title = "Regulatory Element Visualizer"
                              )
