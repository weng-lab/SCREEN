import {obj_assign, obj_remove} from '../../../common/common'
import FacetboxReducer from './facetbox_reducer'
import FacetQueryMap from '../helpers/facets_to_query'

export const ADD_FACETBOX = 'ADD_FACETBOX';
export const FACETBOX_ACTION = 'FACETBOX_ACTION';
export const INVALIDATE_RESULTS = 'INVALIDATE_RESULTS';

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

    case INVALIDATE_RESULTS:
	var n_query = FacetQueryMap(state);
	console.log(n_query);
	return Object.assign({}, state, {
	    query: n_query
	});
	
    }

    return state;
    
}
