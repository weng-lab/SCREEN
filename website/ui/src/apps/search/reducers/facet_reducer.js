export const HIDE_FACET = 'HIDE_FACET';
export const SHOW_FACET = 'SHOW_FACET';

const facet_default_state = (reducer) => {
    return {
	title: "",
	visible: false,
	subreducer: null,
	state: subreducer(null)
    };
};

const FacetReducer = (subreducer) => (state = facetbox_default_state(reducer), action) => {

    if (action == null) return state;

    switch (action.type) {

    case HIDE_FACETBOX:
	return Object.assign({}, state, {
	    visible: false
	});

    case SHOW_FACETBOX:
	return Object.assign({}, state, {
	    visible: true
	});
	
    }

    return Object.assign({}, state, {
	state: subreducer(state.state, action)
    });
    
};
export default FacetReducer;
