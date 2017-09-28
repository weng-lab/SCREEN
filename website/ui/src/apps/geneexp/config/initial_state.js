import MainTabInfo from './maintabs.js'

const initialState = (search, globals) => {
    const parsedQuery = search.parsedQuery;

    return {
        ...parsedQuery,
	configuregb_cre: null,
	configuregb_browser: null,
	configuregb_cts: globals.cellTypeInfoArr.map(x => ({
	    ...x,
	    checked: false
	})),
	compartments: globals.cellCompartments,
	compartments_selected: new Set(["cell"]),
	biosample_types: globals.geBiosampleTypes,
	biosample_types_selected: new Set(globals.geBiosampleTypes),
	maintabs: MainTabInfo(parsedQuery, globals),
	maintabs_active: "gene_expression",
	maintabs_visible: true
    };
}

export default initialState;
