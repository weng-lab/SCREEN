#!/usr/bin/env python

from __future__ import print_function

import sys
import os
from natsort import natsorted

sys.path.append(os.path.join(os.path.dirname(__file__), "../utils"))
from utils import AddPath

AddPath(__file__, "..")
from config import Config


def PageTitle(assembly):
    if assembly > "":
        return "SCREEN %s: Search Candidate Regulatory Elements by ENCODE" % assembly
    return "SCREEN: Search Candidate Regulatory Elements by ENCODE"


# exclude chrM
chrom_lengths = {"hg19": {"chr1": 249250621, "chr2": 243199373,
                          "chr3": 198022430, "chr4": 191154276,
                          "chr5": 180915260, "chr6": 171115067,
                          "chr7": 159138663, "chrX": 155270560,
                          "chr8": 146364022, "chr9": 141213431,
                          "chr10": 135534747, "chr11": 135006516,
                          "chr12": 133851895, "chr13": 115169878,
                          "chr14": 107349540, "chr15": 102531392,
                          "chr16": 90354753, "chr17": 81195210,
                          "chr18": 78077248, "chr20": 63025520,
                          "chrY": 59373566, "chr19": 59128983,
                          "chr22": 51304566, "chr21": 48129895},
                 "mm10": {"chr1": 195471971, "chr2": 182113224,
                          "chrX": 171031299, "chr3": 160039680,
                          "chr4": 156508116, "chr5": 151834684,
                          "chr6": 149736546, "chr7": 145441459,
                          "chr10": 130694993, "chr8": 129401213,
                          "chr14": 124902244, "chr9": 124595110,
                          "chr11": 122082543, "chr13": 120421639,
                          "chr12": 120129022, "chr15": 104043685,
                          "chr16": 98207768, "chr17": 94987271,
                          "chrY": 91744698, "chr18": 90702639,
                          "chr19": 61431566}}

chroms = {"hg19": natsorted(chrom_lengths["hg19"].keys()),
          "mm10": natsorted(chrom_lengths["mm10"].keys())}


class helptext:
    docid = "1fWphK-WAyk65d1WO8s0yBqO-_YiD2JdQwlkB3ZqqsYI"
    path = os.path.join(os.path.dirname(__file__), "../",
                        "googleapi", "helptext.txt")


