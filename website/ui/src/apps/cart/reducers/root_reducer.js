import {obj_assign, obj_remove, array_remove, array_insert, array_contains} from '../../../common/common'

import {maintabs} from '../config/maintabs'
import {MainTabsConnector} from '../../search/components/maintab'
import {MainVennConnector} from '../../search/components/main_venn_diagram'

export const RESULTS_FETCHING = 'RESULTS_FETCHING';
export const RESULTS_DONE = 'RESULTS_DONE';
export const RESULTS_ERROR = 'RESULTS_ERROR';

export const CREATE_TABLE = 'CREATE_TABLE';
export const SET_TABLE_RESULTS = 'SET_TABLE_RESULTS';

export const UPDATE_EXPRESSION = 'UPDATE_EXPRESSION';

export const DETAILS_FETCHING = 'DETAILS_FETCHING';
export const DETAILS_DONE = 'DETAILS_DONE';
export const UPDATE_DETAIL = 'UPDATE_DETAIL';

export const SELECT_TAB = 'SELECT_TAB';

export const SET_ACCLIST = 'SET_ACCLIST';

export let root_default_state = {
    acc_list: [],
    results: {
	query: {},
	hits: [],
	order: [],
	columns: [],
	cart_list: [],
	expression_matrix: {
	    collabels: [],
	    rowlabels: [],
	    matrix: []
	},
	fetching: false
    },
    re_detail: {
	q: {
	    accession: "",
	    coord: {
		start: 0,
		end: 0,
		chrom: ""
	    }
	},
	data: {}
    },
    main_tabs: maintabs
};

export const main_tab_connector = MainTabsConnector((state) => (state.main_tabs),
                                                    (dispatch) => (dispatch));

export const RootReducer = (state = root_default_state, action) => {

    if (null == action) {
        return state;
    }

    switch (action.type) {

    case RESULTS_FETCHING:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		fetching: true
	    })
	});

    case SET_ACCLIST:
	return Object.assign({}, state, {
	    acc_list: action.acc_list
	});

    case RESULTS_ERROR:
	console.log("RESULTS_ERROR:", action.requestobj);
	
    case RESULTS_DONE:
	//console.log("results done");
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		fetching: false
	    })
	});

    case CREATE_TABLE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		columns: action.columns,
		order: action.order
	    })
	});

    case SET_TABLE_RESULTS:
	//console.log(action.hits);
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		hits: action.hits
	    })
	});

    case UPDATE_EXPRESSION:
	//console.log("update_expression", action);
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		expression_matrix: action.expression_matrix
	    })
	});

    case UPDATE_DETAIL:
	return Object.assign({}, state, {
	    re_detail: action.response
	});

    case SELECT_TAB:
	if (!(action.selection in state.main_tabs.tabs)) {
            return;
        }
	//console.log("SELECT_TAB", action);
	return Object.assign({}, state, {
	    main_tabs: Object.assign({}, state.main_tabs, {
		selection: action.selection
	    })
	});

    return state;

}
