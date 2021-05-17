/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import { isCart } from "../../../common/utility";

const initialState = (globals, parsedQuery, uuid) => {
  const accession = 1 === parsedQuery.accessions.length ? parsedQuery.accessions[0].toUpperCase() : null;

  return {
    uuid: uuid,
    rfacets: ["dnase", "promoter", "enhancer", "ctcf"],
    rank_dnase_start: 1.64,
    rank_dnase_end: 10.0,
    rank_promoter_start: -10,
    rank_promoter_end: 10,
    rank_enhancer_start: -10,
    rank_enhancer_end: 10,
    rank_ctcf_start: -10,
    rank_ctcf_end: 10,
    gene_all_start: 0,
    gene_all_end: 5000000,
    gene_pc_start: 0,
    gene_pc_end: 5000000,
    ...parsedQuery,
    cart_accessions: new Set(parsedQuery.cart_accessions),
    tfs_selection: new Set(),
    tfs_mode: null,

    compartments_selected: new Set(["cell"]),
    biosample_types_selected: new Set(globals.geBiosampleTypes),

    active_cre: null,
    cre_accession_detail: accession,

    configuregb_cre: accession,
    configuregb_browser: null,
    configuregb_cts: globals.cellTypeInfoArr,

    gb_cres: {}, // set of accessions to show in GB, and their metadata

    // re_details_tab_active: subtab,
    tree_rank_method: "H3K27ac",
    tree_nodes_compare: null,
  };
};

export default initialState;
