var React = require('react');

import ResultsApp from '../components/results_app'

import DetailsApp, {details_connector} from '../../search/components/details_app'
import {tabs} from '../../search/config/details'

import {expression_heatmap_connector} from '../../search/components/expression_heatmap'
import Heatmap from '../../../common/components/heatmap'
import {main_venn_connector} from '../reducers/root_reducer'
import MainVennDiagram from '../../search/components/main_venn_diagram'

export const maintabs = {
    id: "main",
    selection: "results",
    tabs: {
	results: {
	    title: "Cart Items",
	    visible: true,
	    render: (store, key) => (<ResultsApp store={store} key={key} />)
	},
	details: {
	    title: "RE Details",
	    visible: true,
	    render: (store, key) => {
		var Details = details_connector(DetailsApp);
		return <Details store={store} tabs={tabs} key={key} />;
	    }
	},
	gene_expression: {
	    title: "Nearby Gene Expression",
	    visible: true,
	    render: (store, key) => {
		var ExpressionHeatmap = expression_heatmap_connector(Heatmap);
		return <ExpressionHeatmap store={store} key={key} />;
	    }
	}
    }
};
