import {obj_assign, obj_remove, array_remove, array_insert, array_contains} from '../../../common/common'
import FacetboxReducer from './facetbox_reducer'
import TabReducer from './tab_reducer'

import {maintabs} from '../config/maintabs'
import {MainTabsConnector} from '../components/maintab'

export const ADD_FACETBOX = 'ADD_FACETBOX';
export const FACETBOX_ACTION = 'FACETBOX_ACTION';
export const RESULTS_FETCHING = 'RESULTS_FETCHING';
export const RESULTS_DONE = 'RESULTS_DONE';
export const RESULTS_ERROR = 'RESULTS_ERROR';

export const ADD_RESULTS_DISPLAY = 'ADD_RESULTS_DISPLAY';
export const RESULTS_DISPLAY_ACTION = 'RESULTS_DISPLAY_ACTION';

export const CREATE_TABLE = 'CREATE_TABLE';
export const SET_TABLE_RESULTS = 'SET_TABLE_RESULTS';
export const TOGGLE_CART_ITEM = 'TOGGLE_CART_ITEM';

export const UPDATE_EXPRESSION = 'UPDATE_EXPRESSION';

export const DETAILS_FETCHING = 'DETAILS_FETCHING';
export const DETAILS_DONE = 'DETAILS_DONE';
export const UPDATE_DETAIL = 'UPDATE_DETAIL';
export const SET_DETAIL_TAB = 'SET_DETAIL_TAB';

export const TAB_ACTION = 'TAB_ACTION';

export const UPDATE_COMPARISON = 'UPDATE_COMPARISON';

export const EXPRESSION_LOADING = 'EXPRESSION_LOADING';
export const EXPRESSION_DONE = 'EXPRESSION_DONE';

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
	    matrix: [],
	    fetching: false
	},
	total: 0,
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
	data: {},
	tab_selection: 0
    },
    main_tabs: maintabs,
    comparison: {
	threshold: 1000,
	rank_type: "enhancer"
    },
    results_displays: {}
};

export const main_tab_connector = MainTabsConnector(
    (state) => (state.main_tabs),
    (dispatch) => ((action) => {
	dispatch({
	    type: TAB_ACTION,
	    target: "main_tabs",
	    subaction: action
	});
    })
);

export const RootReducer = (state = root_default_state, action) => {

    if (null == action) {
        return state;
    }

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

    case RESULTS_DISPLAY_ACTION:
	if (!(action.key in state.results_displays)) return state;
	var n_item = state.results_displays[action.key].reducer(state.results_displays[action.key], action.subaction);
	return Object.assign({}, state, {
	    results_displays: obj_assign(state.results_displays, action.key, n_item)
	});
	
    case FACETBOX_ACTION:

	/*
	 *  pass this action on to the specified facetbox if it exists
	 */
	if (!(action.key in state.facet_boxes)){
            return state;
        }
	var n_item = FacetboxReducer(state.facet_boxes[action.key],
                                     action.subaction);
	return Object.assign({}, state, {
	    facet_boxes: obj_assign(state.facet_boxes, action.key, n_item)
	});

    case RESULTS_FETCHING:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		fetching: true
	    })
	});

    case ADD_RESULTS_DISPLAY:
	var n_rd = Object.assign({}, state.results_displays);
	n_rd[action.key] = action.results_display;
	return Object.assign({}, state, {
	    results_displays: n_rd
	});

    case EXPRESSION_LOADING:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		expression_matrix: Object.assign({}, state.results.expression_matrix, {
		    fetching: true
		})
	    })
	});

    case EXPRESSION_DONE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		expression_matrix: Object.assign({}, state.results.expression_matrix, {
		    fetching: false
		})
	    })
	});

    case RESULTS_ERROR:
	console.log("RESULTS_ERROR:", action.requestobj);

    case RESULTS_DONE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		fetching: false,
		total: action.results.results.total
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
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		hits: action.hits
	    })
	});

    case TOGGLE_CART_ITEM:
	var n_cart_list =
            (array_contains(state.results.cart_list, action.accession)
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
	return Object.assign({}, state, {
	    re_detail: Object.assign({}, action.response, {
		tab_selection: 0
	    })
	});

    case SET_DETAIL_TAB:
	return Object.assign({}, state, {
	    re_detail: Object.assign({}, state.re_detail, {
		tab_selection: action.tab_selection
	    })
	});

    case TAB_ACTION:
	var n_state = Object.assign({}, state);
	n_state[action.target] = TabReducer(n_state[action.target], action.subaction);
	return n_state;
	
    }

    return state;

}
