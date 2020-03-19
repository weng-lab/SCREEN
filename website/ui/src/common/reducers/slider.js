export const SET_VALUE = 'SET_VALUE';
export const SET_RANGE = 'SET_RANGE';

export let slider_default_state = {
    range: [0, 1],
    selection: 1
};

export function SliderFacetReducer(state = slider_default_state, action) {

    if (action == null) return state;
    
    switch (action.type) {

    case SET_VALUE:
	return Object.assign({}, state, {
	    value: action.value
	});
	
    case SET_RANGE:
	var value = state.value;
	if (value < action.range[0]) value = action.range[0];
	if (value > action.range[1]) value = action.range[1];
	return Object.assign({}, state, {
	    range: action.range,
	    value
	});
	
    }

    return state;
    
};
