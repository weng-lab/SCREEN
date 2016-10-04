import {obj_assign, obj_remove, array_remove, array_insert, array_contains} from '../../../common/common'
import FacetboxReducer from './facetbox_reducer'

import {maintabs} from '../config/maintabs'
import {MainTabsConnector} from '../components/maintab'

export const ADD_FACETBOX = 'ADD_FACETBOX';
export const FACETBOX_ACTION = 'FACETBOX_ACTION';
export const RESULTS_FETCHING = 'RESULTS_FETCHING';
export const RESULTS_DONE = 'RESULTS_DONE';
export const RESULTS_ERROR = 'RESULTS_ERROR';

export const CREATE_TABLE = 'CREATE_TABLE';
export const SET_TABLE_RESULTS = 'SET_TABLE_RESULTS';
export const TOGGLE_CART_ITEM = 'TOGGLE_CART_ITEM';

export const UPDATE_EXPRESSION = 'UPDATE_EXPRESSION';

export const DETAILS_FETCHING = 'DETAILS_FETCHING';
export const DETAILS_DONE = 'DETAILS_DONE';
export const UPDATE_DETAIL = 'UPDATE_DETAIL';

export const SELECT_TAB = 'SELECT_TAB';

export let root_default_state = {
    facet_boxes: {},
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
	}
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

export const main_tab_connector = MainTabsConnector((state) => (state.main_tabs), (dispatch) => (dispatch));

export const RootReducer = (state = root_default_state, action) => {

    if (action == null) return state;
    
    switch (action.type) {

    case ADD_FACETBOX:
	return Object.assign({}, state, {
	    facet_boxes: obj_assign(state.facet_boxes, action.key, {
		visible: action.visible,
		title: action.title,
		facets: action.facets,
		display_map: action.display_map
	    })
	});

    case FACETBOX_ACTION:
	
	/*
	 *  pass this action on to the specified facetbox if it exists
	 */
	if (!(action.key in state.facet_boxes)) return state;
	var n_item = FacetboxReducer(state.facet_boxes[action.key], action.subaction);
	return Object.assign({}, state, {
	    facet_boxes: obj_assign(state.facet_boxes, action.key, n_item)
	});

    case RESULTS_DONE:
	return state;

    case RESULTS_ERROR:
	console.log(action.requestobj);
	return state;

    case CREATE_TABLE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		columns: action.columns,
		order: action.order
	    })
	});

    case SET_TABLE_RESULTS:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		hits: action.hits
	    })
	});

    case TOGGLE_CART_ITEM:
	var n_cart_list = (array_contains(state.results.cart_list, action.accession)
			   ? array_remove(state.results.cart_list, action.accession)
			   : array_insert(state.results.cart_list, action.accession));
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		cart_list: n_cart_list
	    })
	});

    case UPDATE_EXPRESSION:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		expression_matrix: action.expression_matrix
	    })
	});

    case UPDATE_DETAIL:
	console.log(action.response);
	return Object.assign({}, state, {
	    re_detail: action.response
	});

    case SELECT_TAB:
	if (!(action.selection in state.main_tabs.tabs)) return;
	return Object.assign({}, state, {
	    main_tabs: Object.assign({}, state.main_tabs, {
		selection: action.selection
	    })
	});
	
    }

    return state;
    
}
