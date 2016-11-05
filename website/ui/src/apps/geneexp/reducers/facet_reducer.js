const facet_default_state = (subreducer) => {
    return {
	title: "",
	visible: false,
	subreducer: null,
	state: subreducer(null),
    };
};

const FacetReducer = (subreducer) => (state = facet_default_state(subreducer), action) => {

    if (action == null) return state;
    
    return Object.assign({}, state, {
	state: subreducer(state.state, action)
    });
};
export default FacetReducer;
