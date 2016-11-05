import QueryAJAX from '../../search/elasticsearch/ajax'
import {SET_VENN_RESULTS} from '../reducers/venn_reducer'
import FacetQueryMap, {FacetsToSearchText} from '../../search/elasticsearch/facets_to_query'
import ResultsDispatchMap from '../../search/elasticsearch/results_to_map'
import {results_fetching, results_error, results_done, set_table_results, set_searchtext} from '../../search/helpers/invalidate_results'

export const set_venn_results = (results) => {
    return {
	type: SET_VENN_RESULTS,
	results
    };
};

export const invalidate_comparison = (state) => {
    return (dispatch) => {

	var n_query = FacetQueryMap(state);
	
	var f_success = (response, status, jqxhr) => {
	    ResultsDispatchMap(state, response, dispatch);
	    dispatch(set_table_results(response.results.hits));
	    dispatch(set_venn_results(response.venn));
	    dispatch(results_done(response));
	    dispatch(set_searchtext(FacetsToSearchText(state)));
	};
	var f_error = (jqxhr, status, error) => {
	    dispatch(results_error(jqxhr, error));
	};

	dispatch(results_fetching());
	QueryAJAX(n_query, f_success, f_error);
	
    }
};
