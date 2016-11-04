import QueryAJAX, {DetailAJAX, ExpressionBoxplotAJAX} from '../elasticsearch/ajax'
import {UPDATE_EXPRESSION_BOXPLOT, EXPRESSION_BOXPLOT_DONE, EXPRESSION_BOXPLOT_LOADING} from '../reducers/root_reducer'
import FacetQueryMap from '../elasticsearch/facets_to_query'
import ResultsDispatchMap from '../elasticsearch/results_to_map'

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

export const invalidate_boxplot = (store) => {
    console.log("invalidate_boxplot", store);
    return (dispatch) => {
	var query = {
	    gene: store
	};
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
