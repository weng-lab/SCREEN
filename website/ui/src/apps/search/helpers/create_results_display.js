import React from 'react'

import {connect} from 'react-redux'

import {ADD_RESULTS_DISPLAY, RESULTS_DISPLAY_ACTION} from '../reducers/root_reducer'

import VerticalBar from "../../../common/components/vertical_bar.js"
import VerticalBarReducer from '../../../common/reducers/vertical_bar'

import Heatmap, {default_heatmap_layout} from "../../../common/components/heatmap"
import HeatmapReducer from '../../../common/reducers/heatmap'

export const VERTICAL_BAR = 'VERTICAL_BAR';
export const HEATMAP = 'HEATMAP';

const heatmap_layout = Object.assign({}, default_heatmap_layout, {
    margin: Object.assign({}, default_heatmap_layout.margin, {
	left: 100
    })
});

const vertical_bar_props_map = (store, key) => (_state) => {
    var state = _state.results_displays[key];
    return {
	data: state.data,
	width: state.width,
	height: state.height,
	xlabels: state.xlabels,
	title: state.title,
	loading: state.loading
    };
};

const heatmap_props_map = (store, key) => (_state) => {
    var state = _state.results_displays[key];
    return {
	collabels: state.collabels,
	rowlabels: state.rowlabels,
	data: state.matrix,
	title: state.title,
	loading: state.loading,
	chart_layout: heatmap_layout
    };
};

const _map = {
    VERTICAL_BAR: {
	connector: (store, key) => connect(vertical_bar_props_map(store, key)),
	component: VerticalBar,
	reducer: VerticalBarReducer
    },
    HEATMAP: {
	connector: (store, key) => connect(heatmap_props_map(store, key)),
	component: Heatmap,
	reducer: HeatmapReducer
    }
};

const add_results_display = (key, props) => {
    var n_props = Object.assign({}, props, {
	reducer: _map[props.type].reducer,
	dispatcher: (dispatch) => (action) => {dispatch({
	    type: RESULTS_DISPLAY_ACTION,
	    key,
	    subaction: action
	})}
    });
    return {
	type: ADD_RESULTS_DISPLAY,
	key,
	results_display: n_props
    };
};

export const ResultsDisplayCreator = (store) => (key, props) => {
    store.dispatch(add_results_display(key, props));
    var link = _map[props.type];
    return link.connector(store, key)(link.component);
};
