import MainTabInfo from './maintabs.js'

const initialState = {
        ...GlobalParsedQuery,
    compartments: new Set(),
    maintabs: MainTabInfo,
    maintabs_active: "gene_expression",
    maintabs_visible: true
};

export default initialState;
