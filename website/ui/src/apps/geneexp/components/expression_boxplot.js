var React = require('react')

import {connect} from 'react-redux';

import {invalidate_results} from '../helpers/invalidate_results'

const props_map = (state) => {
    return {
	items: state.results.expression_boxplot.items,
	loading: state.results.expression_boxplot.fetching
    };
};

export const expression_boxplot_connector = connect(props_map);
