#!/usr/bin/env python

import nltk
sentence = """At eight o'clock on Thursday morning  Arthur didn't feel very good."""
tokens = nltk.word_tokenize(sentence)
print tokens

class ParseSearch:
    def __init__(self):
        pass

    def _is_snp(self, t):
        return re.search(r"rs\d+", t)

    def _is_gene(self, t):
        pass
    
    def parse(self, s):
        toks = s.split()

        snp = None
        coord = None
        gene = None
        for t in toks:
            continue
