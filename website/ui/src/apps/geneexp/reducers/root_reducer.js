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

export const TAB_ACTION = 'TAB_ACTION';

export const UPDATE_EXPRESSION_BOXPLOT = 'UPDATE_EXPRESSION_BOXPLOT';
export const EXPRESSION_BOXPLOT_LOADING = 'EXPRESSION_BOXPLOT_LOADING';
export const EXPRESSION_BOXPLOT_DONE = 'EXPRESSION_BOXPLOT_DONE';

export let root_default_state = {
    facet_boxes: {},
    results: {
	expression_boxplot: {
	    data: [],
	    mmax: 0,
	    fetching: true
	},
	fetching: false
    },
    main_tabs: maintabs,
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

    case EXPRESSION_BOXPLOT_LOADING:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		expression_boxplot: Object.assign({},
						 state.results.expression_boxplot, {
		    fetching: true
		})
	    })
	});

    case EXPRESSION_BOXPLOT_DONE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		expression_boxplot: Object.assign({}, state.results.expression_boxplot, {
		    fetching: false
		})
	    })
	});

    case RESULTS_ERROR:
	console.log("RESULTS_ERROR:", action.requestobj);

    case RESULTS_DONE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		fetching: false
	    })
	});

    case UPDATE_EXPRESSION_BOXPLOT:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		expression_boxplot: action.expression_boxplot
	    })
	});

    case TAB_ACTION:
	var n_state = Object.assign({}, state);
	n_state[action.target] = TabReducer(n_state[action.target], action.subaction);
	return n_state;
	
    }

    return state;

}
