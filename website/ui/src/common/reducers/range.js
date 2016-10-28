import {fit_to} from '../common'

export const SET_SELECTION_RANGE = 'SET_SELECTION_RANGE';
export const SET_RANGE = 'SET_RANGE';
export const SET_HPARAMETERS = 'SET_HPARAMETERS';
export const SET_WIDTH = 'SET_WIDTH';

export let default_margin = {
    top: 1,
    bottom: 1,
    left: 1,
    right: 1
};

export let range_default_state = {
    selection_range: [0, 0],
    range: [0, 0],
    h_data: null,
    h_interval: 1,
    h_margin: default_margin,
    h_width: 200
};

export function RangeFacetReducer(state = range_default_state, action) {
    
    if (action == null) return state;
    
    switch (action.type) {
	
    case SET_SELECTION_RANGE:
	var n_selection = [...action.selection_range];
	fit_to(n_selection, state.range);
	return Object.assign({}, state, {
	    selection_range: n_selection
	});

    case SET_WIDTH:
	return Object.assign({}, state, {
	    h_width: action.width
	});
	
    case SET_RANGE:
	var n_selection = [...state.selection_range];
	fit_to(n_selection, action.range);
	return Object.assign({}, state, {
	    selection_range: n_selection,
	    range: action.range
	});

    case SET_HPARAMETERS:
	var h_data = (!("h_data" in action) || action.h_data == null
		      ? state.h_data : action.h_data);
	var h_interval = (!("h_interval" in action) || action.h_interval == null
			  ? state.h_interval : action.h_interval);
	var h_margin = (!("h_margin" in action) || action.h_margin == null
			? state.h_margin : action.h_margin);
	return Object.assign({} , state, {
	    h_data: h_data,
	    h_interval: h_interval,
	    h_margin: h_margin
	});
	
    }

    return state;
    
}
