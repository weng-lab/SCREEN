import {obj_assign, obj_remove} from '../../../common/common'
import FacetboxReducer from './facetbox_reducer'

export const ADD_FACETBOX = 'ADD_FACETBOX';
export const FACETBOX_ACTION = 'FACETBOX_ACTION';
export const RESULTS_FETCHING = 'RESULTS_FETCHING';
export const RESULTS_DONE = 'RESULTS_DONE';
export const RESULTS_ERROR = 'RESULTS_ERROR';

export let root_default_state = {
    facet_boxes: {},
    results: {
	query: {},
	result_list: []
    }
};

export const RootReducer = (state = root_default_state, action) => {

    if (action == null) return state;
    
    switch (action.type) {

    case ADD_FACETBOX:
	return Object.assign({}, state, {
	    facet_boxes: obj_assign(state.facet_boxes, action.key, {
		visible: action.visible,
		title: action.title,
		facets: action.facets
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
	console.log(action.results);
	return state;

    case RESULTS_ERROR:
	console.log(action.requestobj);a
	return state;
	
    }

    return state;
    
}
