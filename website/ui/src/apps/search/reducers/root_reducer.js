import {obj_assign, obj_remove} from '../../../common/common'
import FacetboxReducer from './facetbox_reducer'
import FacetReducer from './facet_reducer'

export const ADD_FACET = 'ADD_FACET';
export const FACET_ACTION = 'FACET_ACTION';
export const ADD_FACETBOX = 'ADD_FACETBOX';
export const FACETBOX_ACTION = 'FACETBOX_ACTION';
export const INVALIDATE_RESULTS = 'INVALIDATE_RESULTS';

export let root_default_state = {
    facets: {},
    facet_boxes: {},
    results: {
	query: {},
	result_list: []
    }
};

export const RootReducer = (state = root_default_state, action) => {

    if (action == null) return state;
    
    switch (action.type) {

    case ADD_FACET:
	console.log("adding facet");
	console.log(action);
	var retval = Object.assign({}, state, {
	    facets: obj_assign(state.facets, action.key, {
		state: action.reducer(action, null),
		reducer: FacetReducer(action.reducer),
		visible: action.visible,
		title: action.title
	    })
	});
	console.log(retval);
	return retval;

    case FACET_ACTION:
	
	/*
	 *  pass this action on to the specified facet if it exists
	 */
	if (!(action.key in state.facets)) return state;
	var subaction = Object.assign({}, action, {type: action.subtype});
	var n_item = state.facets[action.key].reducer(state.facets[action.key].state, subaction);
	return Object.assign({}, state, {
	    facets: obj_assign(state.facets, action.key,
			       Object.assign({}, state.facets[action.key], n_item))
	});

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
	var subaction = Object.assign({}, action, {type: action.subtype});
	var n_item = FacetboxReducer(state.facet_boxes[action.key], subaction);
	return Object.assign({}, state, {
	    facet_boxes: obj_assign(state.facet_boxes, action.key, n_item)
	});

    case INVALIDATE_RESULTS:
	console.log("results invalidated");
	
    }

    return state;
    
}
