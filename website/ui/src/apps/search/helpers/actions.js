import {ADD_FACET, FACET_ACTION, INVALIDATE_RESULTS} from '../reducers/root_reducer'
import {HIDE_FACET, SHOW_FACET} from '../reducers/facet_reducer'

export const hide_facet = (key) => {
    return {
	type: FACET_ACTION,
	subtype: HIDE_FACET,
	key: key
    };
};

export const show_facet = (key) => {
    return {
	type: FACET_ACTION,
	subtype: SHOW_FACET,
	key: key
    };
};

export const facet_action = (key, action, args) => {
    return {
	type: FACET_ACTION,
	action: action,
	...args
    };
};

export const invalidate_results = () => {
    return {
	type: INVALIDATE_RESULTS
    };
};
