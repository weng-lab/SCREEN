import MainTabInfo from './maintabs.js'

const initialState = {
        ...GlobalParsedQuery,
    maintabs: MainTabInfo,
    maintabs_active: "de_expression",
    maintabs_visible: true,
    ct1: "C57BL-6_limb_embryo_11.5_days",
    ct2: "C57BL-6_limb_embryo_15.5_days"
};

export default initialState;
