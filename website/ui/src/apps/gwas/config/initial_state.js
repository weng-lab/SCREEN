import MainTabInfo from './maintabs.js'

const initialState = {
        ...GlobalParsedQuery,
    maintabs: MainTabInfo,
    maintabs_active: "gwas",
    maintabs_visible: true,
    gwas_study: null
};

export default initialState;
