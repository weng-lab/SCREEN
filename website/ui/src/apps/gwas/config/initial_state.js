import MainTabInfo from './maintabs.js'

const try_get_ct = (globals, ct) => {
    globals.cellTypeInfoArr.forEach((arr) => {
	if(arr.cellTypeName === ct) {
	    return arr;
	}
    })
    return null;
}

const initialState = (search, globals) => {
    return {
        ...search,
	configuregb_cre: null,
	configuregb_browser: null,
	configuregb_cts: globals.cellTypeInfoArr.map(x => ({
	    ...x,
	    checked: false
	})),
	maintabs: MainTabInfo(),
	maintabs_active: "gwas",
	maintabs_visible: true,
	gwas_study_tab: "single",
	cellType: try_get_ct(globals, search.ct),
	gwas_cell_types: null,
	cart_accessions: new Set()
    }
}

export default initialState;
