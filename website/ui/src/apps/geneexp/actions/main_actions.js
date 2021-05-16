/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

export const TOGGLE_COMPARTMENT = "TOGGLE_COMPARTMENT";
export const toggleCompartment = (c) => ({ type: TOGGLE_COMPARTMENT, c });

export const TOGGLE_BIOSAMPLE_TYPE = "TOGGLE_BIOSAMPLE_TYPE";
export const toggleBiosampleType = (bt) => ({
  type: TOGGLE_BIOSAMPLE_TYPE,
  bt,
});

export const SET_GENOME_BROWSER_CTS = "SET_GENOME_BROWSER_CTS";
export const setGenomeBrowserCelltypes = (list) => ({
  type: SET_GENOME_BROWSER_CTS,
  list,
});

export const TOGGLE_GENOME_BROWSER_CELLTYPE = "TOGGLE_GENOME_BROWSER_CELLTYPE";
export const toggleGenomeBrowserCelltype = (ct) => ({
  type: TOGGLE_GENOME_BROWSER_CELLTYPE,
  ct,
});

export const SHOW_GENOME_BROWSER = "SHOW_GENOME_BROWSER";
export const showGenomeBrowser = (cre, name, etype = null) => ({
  type: SHOW_GENOME_BROWSER,
  cre,
  name,
  etype,
});

export const SET_MAIN_TAB = "SET_MAIN_TAB";
export const setMainTab = (name) => ({ type: SET_MAIN_TAB, name });
