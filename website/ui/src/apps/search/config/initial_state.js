import maintabs from './maintabs.js'

const initialState = {
        ...GlobalParsedQuery,
    tfs_selection: new Set(), tfs_mode: null,
    gene_all_start: 0, gene_all_end: 5000000,
    gene_pc_start: 0, gene_pc_end: 5000000,
    rank_dnase_start: 0, rank_dnase_end: 20000,
    rank_promoter_start: 0, rank_promoter_end: 20000,
    rank_enhancer_start: 0, rank_enhancer_end: 20000,
    rank_ctcf_start: 0, rank_ctcf_end: 20000,
    maintabs,
    maintabs_active: "results"
};

export default initialState;