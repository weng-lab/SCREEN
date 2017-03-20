import * as Actions from '../actions/main_actions';
import * as SearchAction from '../../../common/actions/searchbox_actions.js'
import {doToggle} from '../../../common/utility'

const main_reducers = (state, action) => {
    switch (action.type) {
	    
	case Actions.SET_STUDY:
            return { ...state, gwas_study: action.s};
	    
	case Actions.SET_CELLTYPE:
	    return {...state, cellType: action.ct};
	    
	case Actions.SET_GWAS_CELL_TYPES:
            return {...state, gwas_cell_types: action.cts};
	    
	case Actions.SET_GWAS_STUDY_TAB:
	    return {...state, gwas_study_tab: action.tab};
	    
	case SearchAction.MAKE_SEARCH_QUERY:
            console.log("new query", action.q);
            return state;
	    
	default:
	    return state;
    }
};

export default main_reducers;
