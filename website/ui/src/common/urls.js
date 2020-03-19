/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

export const geneCardLink = (d) => (
    "http://www.genecards.org/cgi-bin/carddisp.pl?gene=" + d);

export const wikiLink = (d) => (
    "https://en.wikipedia.org/wiki/" + d);

export const ensembleMouse = (d) => (
    "http://www.ensembl.org/Mouse/Search/Results?q=" + d + ";site=ensembl;facet_feature_type=;facet_species=Mouse");
