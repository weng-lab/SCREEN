var React = require('react')

import {connect} from 'react-redux';

import {invalidate_results} from '../helpers/invalidate_results'
import Boxplot from '../../../common/components/boxplot'

const props_map = (state) => {
    return {
	data: GEdata, //state.results.expression_boxplot.data,
	mmax: GEmmax, //state.results.expression_boxplot.mmax,
	loading: false //state.results.expression_boxplot.fetching
    };
};

export const expression_boxplot_connector = connect(props_map);
