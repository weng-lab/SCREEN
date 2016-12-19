var React = require('react');

import ExpressionBoxplot, {expression_boxplot_connector} from '../components/expression_boxplot'
import CandidateREs, {candidate_res_connector} from '../components/candidate_res'
import {main_comparison_connector} from '../reducers/root_reducer'

export const maintabs = {
    id: "main",
    selection: "gene_expression",
    tabs: {
	gene_expression: {
	    title: "Gene Expression",
	    visible: true,
	    render: (store, key) => {
		var Ebp = expression_boxplot_connector(ExpressionBoxplot);
		return <Ebp store={store} key={key}/>;
	    }
	},
	candidate_res: {
	    title: "Candidate Regulatory Elements",
	    visible: true,
	    render: (store, key) => {
		var CandidateREList = candidate_res_connector((state) => (state.results.candidate_res))(CandidateREs);
		return <CandidateREList store={store} key={key} />;
	    }
	}
    }
};
