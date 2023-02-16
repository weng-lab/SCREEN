/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import MainTabInfo from "./maintabs.js"

const try_get_ct = (globals, ct) => {
  globals.cellTypeInfoArr.forEach((arr) => {
    if (arr.cellTypeName === ct) {
      return arr
    }
  })
  return null
}

const initialState = (search, globals) => {
  const subtab = "topTissues"

  return {
    ...search,
    configuregb_cre: null,
    configuregb_browser: null,
    configuregb_cts: globals.cellTypeInfoArr.map((x) => ({
      ...x,
      checked: false,
    })),
    maintabs: MainTabInfo(),
    maintabs_active: "gwas",
    maintabs_visible: true,
    gwas_study_tab: "single",
    cellType: try_get_ct(globals, search.ct),
    gwas_cell_types: null,
    cart_accessions: new Set(),
    re_details_tab_active: subtab,
    compartments_selected: new Set(["cell"]),
    biosample_types_selected: new Set(globals.geBiosampleTypes),
  }
}

export default initialState
