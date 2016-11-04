import React from 'react'

import {connect} from 'react-redux'

import {RangeFacetReducer, SET_SELECTION_RANGE, SET_WIDTH} from '../../../common/reducers/range'
import {ListFacetReducer, SET_SELECTION} from '../../../common/reducers/list'
import {ChecklistFacetReducer, SET_ITEMS, SET_MATCH_MODE} from '../../../common/reducers/checklist'
import {LongListFacetReducer, SET_DATA} from '../../../common/reducers/longlist'
import {LongChecklistFacetReducer, TOGGLE_ITEM} from '../../../common/reducers/longchecklist'
import {SliderFacetReducer, SET_VALUE} from '../../../common/reducers/slider'

import {FACETBOX_ACTION} from '../reducers/root_reducer'
import {FACET_ACTION, ADD_FACET} from '../reducers/facetbox_reducer'
import {facet_action} from './actions'

import MainRangeFacet from '../components/range'
import MainListFacet from '../components/list'
import MainChecklistFacet from '../components/checklist'
import MainLongListFacet from '../components/longlist'
import MainLongChecklistFacet from '../components/longchecklist'
import MainSliderFacet from '../components/slider'

export const RANGE_FACET = 'RANGE_FACET';
export const LIST_FACET = 'LIST_FACET';
export const LONGLIST_FACET = 'LONGLIST_FACET';
export const CHECKLIST_FACET = 'CHECKLIST_FACET';
export const LONGCHECKLIST_FACET = 'LONGCHECKLIST_FACET';
export const SLIDER_FACET = 'SLIDER_FACET';

const range_props_map = (store, box, key) => (_state) => {
    var state = _state.facet_boxes[box];
    return {
	range: state.facets[key].state.range,
	selection_range: state.facets[key].state.selection_range,
	h_margin: state.facets[key].state.h_margin,
	h_interval: state.facets[key].state.h_interval,
	visible: state.facets[key].visible,
	title: state.facets[key].title,
	h_data: state.facets[key].state.h_data,
	h_width: state.facets[key].state.h_width
    };
};

const slider_props_map = (store, box, key) => (_state) => {
    var state = _state.facet_boxes[box];
    return {
	range: state.facets[key].state.range,
	value: state.facets[key].state.value,
	visible: state.facets[key].visible,
	title: state.facets[key].title
    };
}

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

const range_dispatch_map = (store, box, key, invalidator = null) => (dispatch) => {
    return {
	onchange: (selection_range) => {
	    dispatch(facet_action(box, key, {
		type: SET_SELECTION_RANGE,
		selection_range
	    }));
	    if (invalidtor) dispatch(invalidator(store.getState()));
	},
	updateWidth: (width) => {
	    dispatch(facet_action(box, key, {
		type: SET_WIDTH,
		width
	    }));
	}
    };
};

const list_dispatch_map = (store, box, key, invalidator = null) => (dispatch) => {
    return {
	onchange: (selection) => {
	    dispatch(facet_action(box, key, {
		type: SET_SELECTION,
		selection: selection
	    }));
	    if (invalidator) dispatch(invalidator(store.getState()));
	}
    };
};

const checklist_dispatch_map = (store, box, key, invalidator = null) => (dispatch) => {
    return {
	onchange: (items) => {
	    dispatch(facet_action(box, key, {
		type: SET_ITEMS,
		items: items
	    }));
	    if (invalidator) dispatch(invalidator(store.getState()));
	},
	onModeChange: (mode) => {
	    dispatch(facet_action(box, key, {
		type: SET_MATCH_MODE,
		mode
	    }));
	    if (invalidator) dispatch(invalidator(store.getState()));
	}
    };
};

const longchecklist_dispatch_map = (store, box, key, invalidator = null) => (dispatch) => {
    return {
	onTdClick: (k) => {
	    dispatch(facet_action(box, key, {
		type: TOGGLE_ITEM,
		key: k
	    }));
	    if (invalidator) dispatch(invalidator(store.getState()));
	},
	onModeChange: (mode) => {
	    dispatch(facet_action(box, key, {
		type: SET_MATCH_MODE,
		mode
	    }));
	    if (invalidator) dispatch(invalidator(store.getState()));
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

const longlist_dispatch_map = (store, box, key, invalidator = null) => (dispatch) => {
    return {
	onTdClick: (selection) => {
	    dispatch(facet_action(box, key, {
		type: SET_SELECTION,
		selection
	    }));
	    if (invalidator) dispatch(invalidator(store.getState()));
	}
    };
};

const slider_dispatch_map = (store, box, key, invalidator = null) => (dispatch) => {
    return {
	onChange: (value) => {
	    dispatch(facet_action(box, key, {
		type: SET_VALUE,
		value
	    }));
	    if (invalidator) dispatch(invalidator(store.getState()));
	}
    };
};

const _map = {
    RANGE_FACET: {
	connector: (store, box, key, invalidator = null) => connect(range_props_map(store, box, key), range_dispatch_map(store, box, key, invalidator)),
	component: MainRangeFacet,
	reducer: RangeFacetReducer
    },
    LIST_FACET: {
	connector: (store, box, key, invalidator = null) => connect(list_props_map(store, box, key), list_dispatch_map(store, box, key, invalidator)),
	component: MainListFacet,
	reducer: ListFacetReducer
    },
    CHECKLIST_FACET: {
	connector: (store, box, key, invalidator = null) => connect(checklist_props_map(store, box, key), checklist_dispatch_map(store, box, key, invalidator)),
	component: MainChecklistFacet,
	reducer: ChecklistFacetReducer
    },
    LONGLIST_FACET: {
	connector: (store, box, key, invalidator = null) => connect(longlist_props_map(store, box, key), longlist_dispatch_map(store, box, key, invalidator)),
	component: MainLongListFacet,
	reducer: LongListFacetReducer
    },
    LONGCHECKLIST_FACET: {
	connector: (store, box, key, invalidator = null) => connect(longchecklist_props_map(store, box, key), longchecklist_dispatch_map(store, box, key, invalidator)),
	component: MainLongChecklistFacet,
	reducer: LongChecklistFacetReducer
    },
    SLIDER_FACET: {
	connector: (store, box, key, invalidator = null) => connect(slider_props_map(store, box, key), slider_dispatch_map(store, box, key, invalidator)),
	component: MainSliderFacet,
	reducer: SliderFacetReducer
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

export const FacetCreator = (store, box, invalidator = null) => (key, props) => {
    store.dispatch(add_facet(box, key, props));
    var link = _map[props.type];
    return link.connector(store, box, key, invalidator)(link.component);
};

export const wrap_facet = (visible, facet) => {
    var display = (visible ? "block" : "none");
    return <div style={{display: display}}>{facet}</div>
};
