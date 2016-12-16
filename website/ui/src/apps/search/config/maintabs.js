var React = require('react');
import {connect} from 'react-redux'

import ResultsApp from '../components/results_app'
import ResultsDisplayApp from '../components/results_display_app'
import ResultsTree from '../components/tree'

import DetailsApp, {details_connector} from '../components/details_app'
import {tabs} from './details'

import {main_comparison_connector} from '../reducers/root_reducer'
import {main_tree_connector} from '../reducers/root_reducer'

import TFDisplay from '../../../common/components/tf_display'

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
	ct_tree: {
	    title: "Cell Type Clustering",
	    visible: true,
	    render: (store, key) => {
		var Tree = main_tree_connector(store)(ResultsTree);
		return <Tree store={store} key={key} />
	    }
	},
	details: {
	    title: "RE Details",
	    visible: false,
	    render: (store, key) => {
		var Details = details_connector(DetailsApp);
		return <Details store={store} tabs={tabs} key={key} />;
	    }
	},
	gcompare: {
	    title: "Group comparison",
	    visible: false,
	    render: (store, key) => {
		var Comparison = connect((state) => {
		    return {
			left: state.tree_comparison.left,
			right: state.tree_comparison.right
		    };
		})(TFDisplay);
		return <Comparison store={store} key={key} />;
	    }
	}
    }
};
