var React = require('react')

import {connect} from 'react-redux';

import {invalidate_results} from '../helpers/invalidate_results'
import Heatmap, {default_heatmap_layout} from '../../../common/components/heatmap'

const props_map = (state) => {
    return {
	chart_layout: default_heatmap_layout,
	rowlabels: state.results.expression_matrix.rowlabels,
	collabels: state.results.expression_matrix.collabels,
	data: state.results.expression_matrix.matrix
    };
};

export const expression_heatmap_connector = connect(props_map);
