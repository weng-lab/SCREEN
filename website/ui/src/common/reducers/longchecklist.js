import {array_insert, array_remove} from '../common'

export const TOGGLE_ITEM = 'TOGGLE_ITEM';
export const SET_DATA = 'SET_ITEMS';
export const SET_MATCH_MODE = 'SET_MATCH_MODE';

export let longchecklist_initial_state = {
    data: []
};

function select_all(items, selected) {
    var n_items = [...items];
    for (i in n_items) {
	n_items[i].selected = selected;
    }
    return n_items;
}

const comparator = (a, b) => (a.value == b.value);

export function LongChecklistFacetReducer(state = longchecklist_initial_state, action) {

    if (action == null) return state;
    
    switch (action.type) {

    case TOGGLE_ITEM:
	var n_data = [...state.data];
	for (var k in n_data) {
	    if (n_data[k].key == action.key) n_data[k].selected = !n_data[k].selected;
	}
	return Object.assign({}, state, {
	    data: n_data
	});

    case SET_DATA:
	return Object.assign({}, state, {
	    data: action.data
	});

    case SET_MATCH_MODE:
	return Object.assign({}, state, {
	    mode: action.mode
	});
	
    }
    
    return state;
    
};
