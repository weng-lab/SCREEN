import MainTabInfo from './maintabs.js'

const initialState = () => ({
        ...GlobalParsedQuery,
    compartments: Globals.cellCompartments,
    compartments_selected: new Set(["cell"]),
    biosample_types: Globals.geBiosampleTypes,
    biosample_types_selected: new Set(Globals.geBiosampleTypes),
    maintabs: MainTabInfo(),
    maintabs_active: "gene_expression",
    maintabs_visible: true
});

export default initialState;
