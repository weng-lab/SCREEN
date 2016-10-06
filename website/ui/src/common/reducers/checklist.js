import {array_insert, array_remove} from '../common'

export const TOGGLE_ITEM = 'TOGGLE_ITEM';
export const SET_ITEMS = 'SET_ITEMS';
export const ADD_ITEM = 'ADD_ITEM';
export const REMOVE_ITEM = 'REMOVE_ITEM';
export const CLEAR_ALL = 'CLEAR_ALL';
export const SELECT_ALL = 'SELECT_ALL';
export const SET_MATCH_MODE = 'SET_MATCH_MODE';
export const SET_AUTOCOMPLETE_SOURCE = 'SET_AUTOCOMPLETE_SOURCE';

export let checklist_initial_state = {
    items: [],
    autocomplete_source: null
};

function select_all(items, selected) {
    var n_items = [...items];
    for (i in n_items) {
	n_items[i].selected = selected;
    }
    return n_items;
}

const comparator = (a, b) => (a.value == b.value);

export function ChecklistFacetReducer(state = checklist_initial_state, action) {

    if (action == null) return state;
    
    switch (action.type) {

    case TOGGLE_ITEM:
	if (action.index < 0 || action.index >= state.items.length) return state;
	var n_items = [...state.items];
	n_items[action.index].selected = !n_items[action.index].selected;
	return Object.assign({}, state, {
	    items: n_items
	});

    case ADD_ITEM:
	return Object.assign({}, state, {
	    items: array_insert(items.state, {
		value: action.value,
		selected: true
	    }, comparator)
	});

    case REMOVE_ITEM:
	return Object.assign({}, state, {
	    items: array_remove(state.items, action.item, comparator)
	});

    case CLEAR_ALL:
	return Object.assign({}, state, {
	    items: select_all(state.items, false)
	});

    case SELECT_ALL:
	return Object.assign({}, state, {
	    items: select_all(state.items, true)
	});

    case SET_ITEMS:
	return Object.assign({}, state, {
	    items: action.items
	});

    case SET_MATCH_MODE:
	return Object.assign({}, state, {
	    mode: action.mode
	});

    case SET_AUTOCOMPLETE_SOURCE:
	return Object.assign({}, state, {
	    autocomplete_source: action.autocomplete_source
	});
	
    }
    
    return state;
    
};
