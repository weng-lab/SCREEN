var React = require('react');

import {expression_boxplot_connector} from '../components/expression_boxplot'
import Boxplot from '../../../common/components/boxplot'
import {main_comparison_connector} from '../reducers/root_reducer'

export const maintabs = {
    id: "main",
    selection: "gene_expression",
    tabs: {
	gene_expression: {
	    title: "Gene Expression",
	    visible: true,
	    render: (store, key) => {
		var ExpressionBoxplot = expression_boxplot_connector(Boxplot);
		return <ExpressionBoxplot store={store} key={key}/>;
	    }
	}
    }
};
