var React = require('react');

import ResultsApp from '../components/results_app'
import ResultsDisplayApp from '../components/results_display_app'

import DetailsApp, {details_connector} from '../components/details_app'
import {tabs} from './details'

import {main_comparison_connector} from '../reducers/root_reducer'

export const maintabs = {
    id: "main",
    selection: "results",
    tabs: {
	results: {
	    title: "Search results",
	    visible: true,
	    render: (store, key) => (<div>
				        <ResultsApp store={store} key={key + "_main"} />
				        <ResultsDisplayApp store={store} key={key + "_display"} />
				     </div>)
	},
	details: {
	    title: "RE Details",
	    visible: false,
	    render: (store, key) => {
		var Details = details_connector(DetailsApp);
		return <Details store={store} tabs={tabs} key={key} />;
	    }
	}
    }
};
