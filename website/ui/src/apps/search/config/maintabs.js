var React = require('react');

import ResultsApp from '../components/results_app'

import DetailsApp, {details_connector} from '../components/details_app'
import {tabs} from './details'

import {expression_heatmap_connector} from '../components/expression_heatmap'
import Heatmap from '../../../common/components/heatmap'
import {main_venn_connector} from '../reducers/root_reducer'
import MainVennDiagram from '../components/venn'

export const maintabs = {
    id: "main",
    selection: "results",
    tabs: {
	results: {
	    title: "Candidate RE Search",
	    render: (store, key) => (<ResultsApp store={store} key={key} />)
	},
	details: {
	    title: "RE Details",
	    render: (store, key) => {
		var Details = details_connector(DetailsApp);
		return <Details store={store} tabs={tabs} key={key} />;
	    }
	},
	gene_expression: {
	    title: "Nearby Gene Expression",
	    render: (store, key) => {
		var ExpressionHeatmap = expression_heatmap_connector(Heatmap);
		return <ExpressionHeatmap store={store} key={key} />;
	    }
	},
	comparison: {
	    title: "Comparison",
	    render: (store, key) => {
		var VennDiagram = main_venn_connector(store)(MainVennDiagram);
		return <VennDiagram store={store} key={key} />
	    }
	}
    }
};
