import {array_insert, array_remove} from '../common'

export const SET_SELECTION = 'SET_SELECTION';
export const CLEAR_SELECTION = 'CLEAR_SELECTION';
export const ADD_ITEM = 'ADD_ITEM';
export const REMOVE_ITEM = 'REMOVE_ITEM';
export const SET_ITEMS = 'SET_ITEMS';

export let list_default_state = {
    items: [],
    selection: null
};

export function ListFacetReducer(state = list_default_state, action) {

    if (action == null) return state;
    
    switch (action.type) {

    case CLEAR_SELECTION:
	return Object.assign({}, state, {selection: null});
	
    case SET_SELECTION:
	if (action.selection <= -1 || action.selection >= state.items.length)
	    return state;
	return Object.assign({}, state, {
	    selection: action.selection
	});

    case ADD_ITEM:
	return Object.assign({}, state, {
	    items: array_insert(state.items, action.item)
	});

    case REMOVE_ITEM:
	return Object.assign({}, state, {
	    items: array_remove(state.items, action.item)
	});

    case SET_ITEMS:
	console.log(state);
	return Object.assign({}, state, {
	    items: action.items
	});
	
    }

    return state;
    
};
