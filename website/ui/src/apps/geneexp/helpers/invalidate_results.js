import {ExpressionBoxplotAJAX} from '../helpers/ajax'
import {RESULTS_FETCHING, RESULTS_DONE, RESULTS_ERROR, UPDATE_EXPRESSION_BOXPLOT, EXPRESSION_BOXPLOT_DONE, EXPRESSION_BOXPLOT_LOADING} from '../reducers/root_reducer'

export const results_fetching = () => {
    return {
	type: RESULTS_FETCHING
    };
};

export const results_done = (results) => {
    return {
	type: RESULTS_DONE,
	results
    };
};

export const results_error = (requestobj, error) => {
    return {
	type: RESULTS_ERROR,
	requestobj,
	error
    };
};

export const update_expression_boxplot = (expression_boxplot) => {
    return {
	type: UPDATE_EXPRESSION_BOXPLOT,
	expression_boxplot
    };
};

export const expression_boxplot_loading = () => {
    return {
	type: EXPRESSION_BOXPLOT_LOADING
    }
};

export const expression_boxplot_done = (response) => {
    return {
	type: EXPRESSION_BOXPLOT_DONE,
	response
    }
};

const collectCompartments = (s) => {
    var arr = s.facet_boxes.cell_compartments.facets.cell_compartments.state.data;
    var ret = []
    arr.forEach(function(v) {
	ret.push(v);
    });
    return ret;
}

export const invalidate_boxplot = (q) => {
    return (dispatch) => {
	var query = JSON.stringify({
	    "geneID" : GlobalParsedQuery["gene"],
	    "compartments" : collectCompartments(q)
	});
	var f_success = (response, status, jqxhr) => {
	    dispatch(update_expression_boxplot(response));
	    dispatch(expression_boxplot_done(response));
	};
	var f_error = (jqxhr, status, error) => {
	    dispatch(results_error(jqxhr, error));
	};
	dispatch(expression_boxplot_loading());
	ExpressionBoxplotAJAX(query, f_success, f_error);
    }
};
