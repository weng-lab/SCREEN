export const HIDE_FACETBOX = 'HIDE_FACETBOX';
export const SHOW_FACETBOX = 'SHOW_FACETBOX';
export const SET_TITLE = 'SET_TITLE';

const facetbox_default_state = {
    title: "",
    id: "",
    visible: false,
    facets: []
};

const FacetboxReducer = (state = facetbox_default_state, action) => {

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

    case SET_TITLE:
	return Object.assign({}, state, {
	    title: action.title
	});
	
    }

    return state;
    
};
export default FacetboxReducer;
