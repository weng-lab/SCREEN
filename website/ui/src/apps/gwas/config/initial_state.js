import MainTabInfo from './maintabs.js'

const try_get_ct = ct => {
    for (let i = 0; i < Globals.cellTypeInfoArr.length; ++i) {
	if (Globals.cellTypeInfoArr[i].cellTypeName === ct) { return Globals.cellTypeInfoArr[i]; }
    }
    return null;
}

const initialState = (gwas_study = null, ct = null) => ({
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
    gwas_study,
    gwas_study_tab: "single",
    cellType: try_get_ct(ct),
    gwas_cell_types: null,
    cart_accessions: new Set()
});

export default initialState;
