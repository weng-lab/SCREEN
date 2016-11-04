var React = require('react');

import ResultsApp from '../components/results_app'
import {main_venn_connector} from '../reducers/comparison_reducer'
import MainVennDiagram from '../components/venn'

export const maintabs = {
    id: "main",
    selection: "venn",
    tabs: {
	venn: {
	    title: "Element Overlap",
	    visible: true,
	    render: (store, key) => {
		var Venn = main_venn_connector(MainVennDiagram);
		return <Venn store={store} key={key} />;
	    }
	},
	results: {
	    title: "Search Results",
	    visible: true,
	    render: (store, key) => (<div>
 				        <ResultsApp store={store} key={key + "_main"} />
				     </div>)
	}
    }
};
