import React from 'react'

import {connect} from 'react-redux'

import {RangeFacetReducer, SET_SELECTION_RANGE} from '../../../common/reducers/range'
import {ListFacetReducer, SET_SELECTION} from '../../../common/reducers/list'
import {ChecklistFacetReducer, SET_ITEMS, SET_MATCH_MODE} from '../../../common/reducers/checklist'
import {LongListFacetReducer, SET_DATA} from '../../../common/reducers/longlist'
import {LongChecklistFacetReducer, TOGGLE_ITEM} from '../../../common/reducers/longchecklist'

import {FACETBOX_ACTION} from '../reducers/root_reducer'
import {FACET_ACTION, ADD_FACET} from '../reducers/facetbox_reducer'
import {facet_action} from './actions'
import {invalidate_results} from './invalidate_results'

import MainRangeFacet from '../components/range'
import MainListFacet from '../components/list'
import MainChecklistFacet from '../components/checklist'
import MainLongListFacet from '../components/longlist'
import MainLongChecklistFacet from '../components/longchecklist'

export const RANGE_FACET = 'RANGE_FACET';
export const LIST_FACET = 'LIST_FACET';
export const LONGLIST_FACET = 'LONGLIST_FACET';
export const CHECKLIST_FACET = 'CHECKLIST_FACET';
export const LONGCHECKLIST_FACET = 'LONGCHECKLIST_FACET';

const range_props_map = (store, box, key) => (_state) => {
    var state = _state.facet_boxes[box];
    return {
	range: state.facets[key].state.range,
	selection_range: state.facets[key].state.selection_range,
	h_margin: state.facets[key].state.h_margin,
	h_interval: state.facets[key].state.h_interval,
	visible: state.facets[key].visible,
	title: state.facets[key].title,
	h_data: state.facets[key].state.h_data
    };
};

const longchecklist_props_map = (store, box, key) => (_state) => {
    var state = _state.facet_boxes[box];
    return {
	data: state.facets[key].state.data,
	cols: state.facets[key].state.cols,
	visible: state.facets[key].visible,
	order: state.facets[key].state.order,
	match_mode_enabled: state.facets[key].match_mode_enabled,
	title: state.facets[key].title,
	mode: state.facets[key].state.mode
    };
};

const list_props_map = (store, box, key) => (_state) => {
    var state = _state.facet_boxes[box];
    var retval = {
	items: state.facets[key].state.items,
	selection: state.facets[key].state.selection,
	visible: state.facets[key].visible,
	title: state.facets[key].title
    };
    return retval;
};

const checklist_props_map = (store, box, key) => (_state) => {
    var state = _state.facet_boxes[box];
    return {
	items: state.facets[key].state.items,
	match_mode_enabled: state.facets[key].match_mode_enabled,
	visible: state.facets[key].visible,
	title: state.facets[key].title,
	mode: state.facets[key].state.mode,
	autocomplete_source: state.facets[key].state.autocomplete_source
    };
};

const range_dispatch_map = (store, box, key) => (dispatch) => {
    return {
	onchange: (selection_range) => {
	    dispatch(facet_action(box, key, {
		type: SET_SELECTION_RANGE,
		selection_range: selection_range
	    }));
	    dispatch(invalidate_results(store.getState()));
	}
    };
};

const list_dispatch_map = (store, box, key) => (dispatch) => {
    return {
	onchange: (selection) => {
	    dispatch(facet_action(box, key, {
		type: SET_SELECTION,
		selection: selection
	    }));
	    dispatch(invalidate_results(store.getState()));
	}
    };
};

const checklist_dispatch_map = (store, box, key) => (dispatch) => {
    return {
	onchange: (items) => {
	    dispatch(facet_action(box, key, {
		type: SET_ITEMS,
		items: items
	    }));
	    dispatch(invalidate_results(store.getState()));
	},
	onModeChange: (mode) => {
	    dispatch(facet_action(box, key, {
		type: SET_MATCH_MODE,
		mode
	    }));
	    dispatch(invalidate_results(store.getState()));
	}
    };
};

const longchecklist_dispatch_map = (store, box, key) => (dispatch) => {
    return {
	onTdClick: (k) => {
	    dispatch(facet_action(box, key, {
		type: TOGGLE_ITEM,
		key: k
	    }));
	    dispatch(invalidate_results(store.getState()));
	},
	onModeChange: (mode) => {
	    dispatch(facet_action(box, key, {
		type: SET_MATCH_MODE,
		mode
	    }));
	    dispatch(invalidate_results(store.getState()));
	}
    };
};

const longlist_props_map = (store, box, key) => (_state) => {
    var state = _state.facet_boxes[box];
    return {
	data: state.facets[key].state.data,
	cols: state.facets[key].state.cols,
	order: state.facets[key].state.order,
	selection: state.facets[key].state.selection,
	visible: state.facets[key].visible,
	title: state.facets[key].title
    };
};

const longlist_dispatch_map = (store, box, key) => (dispatch) => {
    return {
	onTdClick: (selection) => {
	    dispatch(facet_action(box, key, {
		type: SET_SELECTION,
		selection
	    }));
	    dispatch(invalidate_results(store.getState()));
	}
    };
};

const props_dispatch_map = (dispatch) => {
    return {
	onchange: () => {
	    dispatch(invalidate_results());
	}
    };
};

const _map = {
    RANGE_FACET: {
	connector: (store, box, key) => connect(range_props_map(store, box, key), range_dispatch_map(store, box, key)),
	component: MainRangeFacet,
	reducer: RangeFacetReducer
    },
    LIST_FACET: {
	connector: (store, box, key) => connect(list_props_map(store, box, key), list_dispatch_map(store, box, key)),
	component: MainListFacet,
	reducer: ListFacetReducer
    },
    CHECKLIST_FACET: {
	connector: (store, box, key) => connect(checklist_props_map(store, box, key), checklist_dispatch_map(store, box, key)),
	component: MainChecklistFacet,
	reducer: ChecklistFacetReducer
    },
    LONGLIST_FACET: {
	connector: (store, box, key) => connect(longlist_props_map(store, box, key), longlist_dispatch_map(store, box, key)),
	component: MainLongListFacet,
	reducer: LongListFacetReducer
    },
    LONGCHECKLIST_FACET: {
	connector: (store, box, key) => connect(longchecklist_props_map(store, box, key), longchecklist_dispatch_map(store, box, key)),
	component: MainLongChecklistFacet,
	reducer: LongChecklistFacetReducer
    }
};

const add_facet = (box, key, props) => {
    return {
	type: FACETBOX_ACTION,
	key: box,
	subaction: {
	    type: ADD_FACET,
	    reducer: _map[props.type].reducer,
	    key
	}
    };
};

export const FacetCreator = (store, box) => (key, props) => {
    store.dispatch(add_facet(box, key, props));
    var link = _map[props.type];
    return link.connector(store, box, key)(link.component);
};

export const wrap_facet = (visible, facet) => {
    var display = (visible ? "block" : "none");
    return <div style={{display: display}}>{facet}</div>
};
