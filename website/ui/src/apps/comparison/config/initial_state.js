import MainTabInfo from './maintabs.js'

const initialState = {
        ...GlobalParsedQuery,
    tfs_selection: new Set(), tfs_mode: null,
    gene_all_start: 0, gene_all_end: 5000000,
    gene_pc_start: 0, gene_pc_end: 5000000,
    rank_dnase_start: 164, rank_dnase_end: 1000,
    rank_promoter_start: -1000, rank_promoter_end: 1000,
    rank_enhancer_start: -1000, rank_enhancer_end: 1000,
    rank_ctcf_start: -1000, rank_ctcf_end: 1000,
    maintabs: MainTabInfo,
    maintabs_active: "results",
    maintabs_visible: false,
};

export default initialState;
