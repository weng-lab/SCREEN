import QueryAJAX, {DetailAJAX, ExpressionAJAX, VennAJAX} from '../elasticsearch/ajax'
import {SET_VENN_SELECTIONS, VENN_ERROR, VENN_LOADING, VENN_DONE, UPDATE_VENN, SET_VENN_CELL_LINES, RESULTS_FETCHING, RESULTS_DONE, RESULTS_ERROR, SET_TABLE_RESULTS, UPDATE_EXPRESSION, DETAILS_DONE, DETAILS_FETCHING, UPDATE_DETAIL} from '../reducers/root_reducer'
import FacetQueryMap from '../elasticsearch/facets_to_query'
import VennQueryMap from '../elasticsearch/venn_to_query'
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

export const set_venn_selections = (cell_line, rank_type, rank) => {
    return {
	type: SET_VENN_SELECTIONS,
	cell_line,
	rank_type,
	rank
    };
};

export const set_venn_cell_lines = (cell_lines) => {
    return {
	type: SET_VENN_CELL_LINES,
	cell_lines
    };
};

export const update_venn = (sets, overlaps) => {
    return {
	type: UPDATE_VENN,
	sets,
	overlaps
    };
};

export const venn_done = (response) => {
    return {
	type: VENN_DONE,
	response
    };
};

export const venn_loading = () => {
    return {
	type: VENN_LOADING
    };
};

export const venn_error = (jqxhr, error) => {
    return {
	type: VENN_ERROR,
	jqxhr,
	error
    };
};

export const invalidate_results = (state) => {
    return (dispatch) => {

	var n_query = FacetQueryMap(state);
	var e_success = (response, status, jqxhr) => {
	    dispatch(update_expression(response.expression_matrix));
	};
	var f_success = (response, status, jqxhr) => {
	    ExpressionAJAX(n_query, e_success, f_error);
	    ResultsDispatchMap(state, response, dispatch);
	    dispatch(set_table_results(response.results.hits));
	    dispatch(results_done(response));
	    dispatch(set_venn_cell_lines(response.aggs.cell_lines));
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

export const invalidate_venn = ({cell_line, rank_type, rank}, state) => {
    return (dispatch) => {
	dispatch(venn_loading());
	dispatch(set_venn_selections(cell_line, rank_type, rank));
	var n_query = VennQueryMap(state);
	var f_success = (response, status, jqxhr) => {
	    dispatch(update_venn(response.sets, response.overlaps));
	    dispatch(venn_done(response));
	};
	var f_error = (jqxhr, status, error) => {
	    dispatch(venn_error(jqxhr, error));
	};
	VennAJAX(n_query, f_success, f_error);
    }
};
