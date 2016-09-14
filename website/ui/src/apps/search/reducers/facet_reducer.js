import {ES_CONNECT} from '../helpers/es_connect'
export const HIDE_FACET = 'HIDE_FACET';
export const SHOW_FACET = 'SHOW_FACET';

const facet_default_state = (reducer) => {
    return {
	title: "",
	visible: false,
	subreducer: null,
	state: subreducer(null),
	es_field: null,
	es_map: null
    };
};

const FacetReducer = (subreducer) => (state = facetbox_default_state(reducer), action) => {

    if (action == null) return state;

    switch (action.type) {

    case HIDE_FACET:
	return Object.assign({}, state, {
	    visible: false
	});

    case SHOW_FACET:
	return Object.assign({}, state, {
	    visible: true
	});

    case ES_CONNECT:
	return Object.assign({}, state, {
	    es_map: action.f,
	    es_field: action.es_field
	});
	
    }

    return Object.assign({}, state, {
	state: subreducer(state.state, action)
    });
    
};
export default FacetReducer;
