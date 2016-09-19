import QueryAJAX from '../elasticsearch/ajax'
import {RESULTS_FETCHING, RESULTS_DONE, RESULTS_ERROR} from '../reducers/root_reducer'
import FacetQueryMap from '../elasticsearch/facets_to_query'

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

export const invalidate_results = (state) => {
    return (dispatch) => {
	
	var n_query = FacetQueryMap(state);
	console.log(n_query);
	var f_success = (response, status, jqxhr) => {
	    dispatch(results_done(response));
	};
	var f_error = (jqxhr, status, error) => {
	    dispatch(results_error(jqxhr, error));
	};

	dispatch(results_fetching());
	QueryAJAX(n_query, f_success, f_error);
	
    }
};
