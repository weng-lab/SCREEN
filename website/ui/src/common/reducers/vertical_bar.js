export const SET_DATA = 'SET_DATA';

export let vertical_bar_default_state = {
    data: {}
};

export function VerticalBarReducer(state = vertical_bar_default_state, action) {

    if (action == null) return state;
    
    switch (action.type) {

    case SET_DATA:
	return Object.assign({}, state, {
	    data: action.data
	});
	
    }

    return state;
    
};
export default VerticalBarReducer;
