#!/usr/bin/env python3

import requests

END_DAY = {
    1: 31,
    2: 28,
    3: 31,
    4: 30,
    5: 31,
    6: 30,
    7: 31,
    8: 31,
    9: 30,
    10: 31,
    11: 30,
    12: 31
}

def query(assembly, year, month):
    return requests.get("https://www.encodeproject.org/search/?type=Experiment&format=json&advancedQuery=date_released:[2009-01-01%20TO%20{year}-{month}-{day}]&assembly={assembly}&award.project=ENCODE&award.project=Roadmap&status=released&limit=all".format(year = year, month = month if month >= 10 else "0" + str(month), day = END_DAY[month], assembly = assembly)).json()
