import MainTabInfo from './maintabs.js'

/*global Globals */
/*global GlobalParsedQuery */
/*eslint no-undef: "error"*/

const initialState = () => ({
    ...GlobalParsedQuery,
    maintabs: MainTabInfo,
    maintabs_active: "ctcf_distr",
    maintabs_visible: true,
    biosamples: [...Globals.tad_biosamples],
    biosample: null,
    chrs: Globals.chromCounts.map( x => [x[0], null] ), chr: null
});

export default initialState;
