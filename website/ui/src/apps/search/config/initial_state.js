import MainTabInfo from './maintabs.js'

const initialState = {
    rfacets: ["dnase", "promoter", "enhancer", "ctcf"],
    rank_dnase_start: 164, rank_dnase_end: 1000,
    rank_promoter_start: -1000, rank_promoter_end: 1000,
    rank_enhancer_start: -1000, rank_enhancer_end: 1000,
    rank_ctcf_start: -1000, rank_ctcf_end: 1000,
    gene_all_start: 0, gene_all_end: 5000000,
    gene_pc_start: 0, gene_pc_end: 5000000,
        ...GlobalParsedQuery,
    tfs_selection: new Set(), tfs_mode: null,
    maintabs: MainTabInfo,
    maintabs_active: "results",
    maintabs_visible: false,
    cart_accessions: new Set(),
    cre_accession_detail: null,
    re_details_tab_active: "topTissues",
    tree_rank_method: "DNase",
    tree_nodes_compare : null
};

export default initialState;
