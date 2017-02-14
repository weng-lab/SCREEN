import MainTabInfo from './maintabs.js'

const initialState = {
        ...GlobalParsedQuery,
    maintabs: MainTabInfo,
    maintabs_active: "gwas",
    maintabs_visible: true,
    gwas_study: null,
    cellType: null,
    gwas_cell_types: null,
    cart_accessions: new Set()
};

export default initialState;
