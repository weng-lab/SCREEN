export const SET_SELECTION = 'SET_SELECTION';
export const SET_DATA = 'SET_DATA';

export let longlist_default_state = {
    data: [],
    cols: [],
    order: [],
    selection: null
};

export function LongListFacetReducer(state = longlist_default_state, action) {

    if (action == null) return state;
    
    switch (action.type) {
	
    case SET_SELECTION:
	return Object.assign({}, state, {
	    selection: action.selection
	});

    case SET_DATA:
	return Object.assign({}, state, {
	    data: action.data
	});
	
    }

    return state;
    
};
