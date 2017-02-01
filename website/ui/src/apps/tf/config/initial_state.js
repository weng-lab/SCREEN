import MainTabInfo from './maintabs.js'

const initialState = {
        ...GlobalParsedQuery,
    maintabs: MainTabInfo,
    maintabs_active: "tf_enrichment",
    maintabs_visible: true,
    ct1: new Set([]),
    ct2: new Set([])
};

export default initialState;
