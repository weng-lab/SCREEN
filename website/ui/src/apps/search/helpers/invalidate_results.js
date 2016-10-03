import QueryAJAX, {DetailAJAX} from '../elasticsearch/ajax'
import {RESULTS_FETCHING, RESULTS_DONE, RESULTS_ERROR, SET_TABLE_RESULTS, UPDATE_EXPRESSION, DETAILS_DONE, DETAILS_FETCHING, UPDATE_DETAIL} from '../reducers/root_reducer'
import FacetQueryMap from '../elasticsearch/facets_to_query'
import ResultsDispatchMap from '../elasticsearch/results_to_map'

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

export const set_table_results = (hits) => {
    return {
	type: SET_TABLE_RESULTS,
	hits
    };
};

export const update_expression = (expression_matrix) => {
    return {
	type: UPDATE_EXPRESSION,
	expression_matrix
    };
};

export const details_done = (response) => {
    return {
	type: DETAILS_DONE,
	response
    };
};

export const details_fetching = () => {
    return {
	type: DETAILS_FETCHING
    };
};

export const update_detail = (response) => {
    return {
	type: UPDATE_DETAIL,
	response
    };
};

export const invalidate_results = (state) => {
    return (dispatch) => {

	var n_query = FacetQueryMap(state);
	var f_success = (response, status, jqxhr) => {
	    ResultsDispatchMap(state, response, dispatch);
	    dispatch(update_expression(response.expression_matrix));
	    dispatch(set_table_results(response.results.hits));
	    dispatch(results_done(response));
	};
	var f_error = (jqxhr, status, error) => {
	    dispatch(results_error(jqxhr, error));
	};

	dispatch(results_fetching());
	QueryAJAX(n_query, f_success, f_error);
	
    }
};

export const invalidate_detail = (re) => {
    return (dispatch) => {
	var n_query = {
	    accession: re._source.accession,
	    coord: re._source.position
	};
	var f_success = (response, status, jqxhr) => {
	    dispatch(update_detail(response));
	    dispatch(details_done(response));
	};
	var f_error = (jqxhr, status, error) => {
	    dispatch(results_error(jqxhr, error));
	};
	dispatch(details_fetching());
	DetailAJAX(n_query, f_success, f_error);
    }
};
