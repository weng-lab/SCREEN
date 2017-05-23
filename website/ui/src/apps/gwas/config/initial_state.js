import MainTabInfo from './maintabs.js'

const initialState = () => ({
        ...GlobalParsedQuery,
    configuregb_cre: null,
    configuregb_browser: null,
    configuregb_cts: Globals.cellTypeInfoArr.map(x => ({
	...x,
	checked: false
    })),
    maintabs: MainTabInfo(),
    maintabs_active: "gwas",
    maintabs_visible: true,
    gwas_study: null,
    gwas_study_tab: "single",
    cellType: null,
    gwas_cell_types: null,
    cart_accessions: new Set()
});

export default initialState;
