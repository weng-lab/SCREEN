import QueryAJAX, {DetailAJAX, ExpressionAJAX} from '../elasticsearch/ajax'
import {RESULTS_FETCHING, RESULTS_DONE, RESULTS_ERROR, SET_TABLE_RESULTS, UPDATE_EXPRESSION, DETAILS_DONE,
	DETAILS_FETCHING, UPDATE_DETAIL, EXPRESSION_LOADING, EXPRESSION_DONE, SEARCHBOX_ACTION} from '../reducers/root_reducer'
import {SET_VALUE} from '../../../common/reducers/searchbox'
import {SET_LOADING, SET_COMPLETE} from '../../../common/reducers/vertical_bar'
import FacetQueryMap, {FacetsToSearchText} from '../elasticsearch/facets_to_query'
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

export const expression_loading = () => {
    return {
	type: EXPRESSION_LOADING
    }
};

export const expression_done = (response) => {
    return {
	type: EXPRESSION_DONE,
	response
    }
};

export const set_searchtext = (value) => {
    return {
	type: SEARCHBOX_ACTION,
	target: "searchbox",
	subaction: {
	    type: SET_VALUE,
	    value
	}
    }
}

export const invalidate_results = (state) => {
    return (dispatch) => {

	var n_query = FacetQueryMap(state);
	
	var e_success = (response, status, jqxhr) => {
	    dispatch(update_expression(response.expression_matrix));
	    dispatch(expression_done(response));
	};

	var d_error = (key) => (response, status, jqxhr) => {};
	var d_success = (key) => (response, status, jqxhr) => {
	    var r = state.results_displays[key];
	    if (r.dispatch_result) r.dispatch_result(response, r.dispatcher(dispatch));
	    r.dispatcher(dispatch)({type: SET_COMPLETE});
	};
	
	var f_success = (response, status, jqxhr) => {
	    ResultsDispatchMap(state, response, dispatch);
	    dispatch(set_table_results(response.results.hits));
	    dispatch(results_done(response));
	    dispatch(set_searchtext(FacetsToSearchText(state)));
	};
	var f_error = (jqxhr, status, error) => {
	    dispatch(results_error(jqxhr, error));
	};

	dispatch(results_fetching());
	dispatch(expression_loading());
	QueryAJAX(n_query, f_success, f_error);
	ExpressionAJAX(n_query, e_success, f_error);
	Object.keys(state.results_displays).map((k) => {
	    var r = state.results_displays[k];
	    QueryAJAX(r.append_query(n_query), d_success(k), d_error(k))
	    r.dispatcher(dispatch)({type: SET_LOADING});
	});
	
    }
};

export const invalidate_detail = (re) => {
    return (dispatch) => {
	var n_query = {
	    accession: re._source.accession,
	    coord: re._source.position,
	    peak_intersections: re._source.peak_intersections,
	    ranks: re._source.ranks
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
