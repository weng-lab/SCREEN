import MainTabInfo from './maintabs.js'

/*global Globals */
/*global GlobalParsedQuery */
/*eslint no-undef: "error"*/

const initialState = () => ({
        ...GlobalParsedQuery,
    configuregb_cre: null,
    configuregb_browser: null,
    configuregb_cts: Globals.cellTypeInfoArr.map(x => ({
	...x,
	checked: false
    })),
    compartments: Globals.cellCompartments,
    compartments_selected: new Set(["cell"]),
    biosample_types: Globals.geBiosampleTypes,
    biosample_types_selected: new Set(Globals.geBiosampleTypes),
    maintabs: MainTabInfo(),
    maintabs_active: "gene_expression",
    maintabs_visible: true
});

export default initialState;
