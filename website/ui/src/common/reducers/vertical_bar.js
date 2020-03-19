export const SET_DATA = 'SET_DATA';
export const SET_LOADING = 'SET_LOADING';
export const SET_COMPLETE = 'SET_COMPLETE';

export let vertical_bar_default_state = {
    data: {},
    loading: false
};

export function VerticalBarReducer(state = vertical_bar_default_state, action) {

    if (action == null) return state;
    
    switch (action.type) {

    case SET_DATA:
	return Object.assign({}, state, {
	    data: action.data
	});

    case SET_LOADING:
	return Object.assign({}, state, {
	    loading: true
	});

    case SET_COMPLETE:
	return Object.assign({}, state, {
	    loading: false
	});
	
    }

    return state;
    
};
export default VerticalBarReducer;
