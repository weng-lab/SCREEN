export const ADD_FACET = 'ADD_FACET';
export const FACET_ACTION = 'FACET_ACTION';
export const HIDE_FACETBOX = 'HIDE_FACETBOX';
export const SHOW_FACETBOX = 'SHOW_FACETBOX';
export const SET_TITLE = 'SET_TITLE';

import FacetReducer from './facet_reducer'
import {obj_assign} from '../../../common/common'

const facetbox_default_state = {
    title: "",
    id: "",
    visible: false,
    facets: []
};

const FacetboxReducer = (state = facetbox_default_state, action) => {

    if (action == null) return state;
    
    switch (action.type) {

    case ADD_FACET:
	var retval = Object.assign({}, state, {
	    facets: obj_assign(state.facets, action.key,
			       Object.assign({}, state.facets[action.key], {
				   reducer: FacetReducer(action.reducer)
			       }))
	});
	return retval;

    case FACET_ACTION: // pass this action on to the specified facet if it exists
	if (!(action.key in state.facets)) return state;
	var n_item = state.facets[action.key].reducer(state.facets[action.key], action.subaction);
	var retval = Object.assign({}, state, {
	    facets: obj_assign(state.facets, action.key,
			       Object.assign({}, state.facets[action.key], n_item))
	});
	return retval;
    }

    return state;
    
};
export default FacetboxReducer;
