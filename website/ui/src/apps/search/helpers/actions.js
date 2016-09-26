import {FACETBOX_ACTION} from '../reducers/root_reducer'
import {ADD_FACET, FACET_ACTION} from '../reducers/facetbox_reducer'
import {HIDE_FACET, SHOW_FACET} from '../reducers/facet_reducer'

export const facetbox_dispatch = (box, dispatch) => (action) => {
    dispatch({
	type: FACETBOX_ACTION,
	key: box,
	subaction: action
    });
};

export const facet_dispatch = (box, key, dispatch) => (action) => {
    facetbox_dispatch(box, dispatch)({
	type: FACET_ACTION,
	key,
	subaction: action
    });
};

export const hide_facet = (key) => {
    return {
	type: FACET_ACTION,
	subtype: HIDE_FACET,
	key
    };
};

export const show_facet = (key) => {
    return {
	type: FACET_ACTION,
	subtype: SHOW_FACET,
	key
    };
};

export const facet_action = (box, key, action) => {
    return {
	type: FACETBOX_ACTION,
	key: box,
	subaction: {
	    type: FACET_ACTION,
	    key,
	    subaction: action
	}
    };
};
