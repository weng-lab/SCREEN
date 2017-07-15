import MainTabInfo from './maintabs.js'

let chrs = Globals.chromCounts.map( x => [x[0], null] );
console.log(chrs);

const initialState = {
    ...GlobalParsedQuery,
    maintabs: MainTabInfo,
    maintabs_active: "ctcf_distr",
    maintabs_visible: true,
    chrs, chr: null
};

export default initialState;
