import React from 'react'

import {connect} from 'react-redux'

import {RangeFacetReducer} from '../../../common/reducers/range'
import {ListFacetReducer} from '../../../common/reducers/list'
import {ChecklistFacetReducer} from '../../../common/reducers/checklist'

import {ADD_FACET} from '../reducers/root_reducer'
import {invalidate_results, facet_action} from './actions'

import MainRangeFacet from '../components/range'
import MainListFacet from '../components/list'
import MainChecklistFacet from '../components/checklist'

export const RANGE_FACET = 'RANGE_FACET';
export const LIST_FACET = 'LIST_FACET';
export const CHECKLIST_FACET = 'CHECKLIST_FACET';

const range_props_map = (key) => (state) => {
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

const list_props_map = (key) => (state) => {
    return {
	items: state.facets[key].state.items,
	selection: state.facets[key].state.selection,
	visible: state.facets[key].visible,
	title: state.facets[key].title
    };
};

const checklist_props_map = (key) => (state) => {
    return {
	items: state.facets[key].state.items,
	visible: state.facets[key].visible,
	title: state.facets[key].title
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
	connector: (key) => connect(range_props_map(key), props_dispatch_map),
	component: MainRangeFacet,
	reducer: RangeFacetReducer
    },
    LIST_FACET: {
	connector: (key) => connect(list_props_map(key), props_dispatch_map),
	component: MainListFacet,
	reducer: ListFacetReducer
    },
    CHECKLIST_FACET: {
	connector: (key) => connect(checklist_props_map(key), props_dispatch_map),
	component: MainChecklistFacet,
	reducer: ChecklistFacetReducer
    }
};

const add_facet = (key, props) => {
    console.log(_map[props.type]);
    return Object.assign({}, props, {
	type: ADD_FACET,
	reducer: _map[props.type].reducer,
	key
    });
};

export const FacetCreator = (store) => (key, props) => {
    store.dispatch(add_facet(key, props));
    console.log("dispatched add_facet:");
    console.log(add_facet(key, props));
    console.log("store is:");
    console.log(store);
    var link = _map[props.type];
    console.log("created component with props:");
    console.log(props);
    return link.connector(key)(link.component);
};

export const wrap_facet = (visible, facet) => {
    var display = (visible ? "block" : "none");
    return (
	    <div style={{display: display}}>{facet}</div>
    );
};
