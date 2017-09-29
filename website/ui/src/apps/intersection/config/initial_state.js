import MainTabInfo from './maintabs.js'

/*global Globals */
/*eslint no-undef: "error"*/

const initialState = () => ({
//        ...GlobalParsedQuery,
    configuregb_cre: null,
    configuregb_browser: null,
    configuregb_cts: Globals.cellTypeInfoArr.map(x => ({
	...x,
	checked: false
    })),
    maintabs: MainTabInfo(),
    maintabs_active: "fantomcat",
    maintabs_visible: true
});

export default initialState;
