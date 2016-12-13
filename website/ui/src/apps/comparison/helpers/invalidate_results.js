import QueryAJAX, {ChrAJAX} from '../elasticsearch/ajax'
import {SET_VENN_RESULTS} from '../reducers/venn_reducer'
import {SET_RESULTS_LOADING, SET_RESULTS_COMPLETE, SET_TABLE_RESULTS} from '../reducers/results_reducer'
import {SET_SPEARMAN} from '../reducers/comparison_reducer'
import FacetQueryMap, {FacetsToSearchText} from '../../search/elasticsearch/facets_to_query'
import ResultsDispatchMap from '../../search/elasticsearch/results_to_map'
import {results_fetching, results_error, set_searchtext} from '../../search/helpers/invalidate_results'
import {array_contains} from '../../../common/common'

export const set_venn_results = (results) => {
    return {
	type: SET_VENN_RESULTS,
	results
    };
};

export const results_done = (results) => {
    return {
	type: SET_RESULTS_COMPLETE
    };
};

export const results_loading = () => {
    return {
	type: SET_RESULTS_LOADING
    };
};

export const set_table_results = (results) => {
    return {
	type: SET_TABLE_RESULTS,
	results
    };
};

const get_query = (state) => {
    var n_query = FacetQueryMap(state);
    if (state.venn.table_cell_types.length == 2
	&& array_contains(n_query.extras.venn.cell_types, state.venn.table_cell_types[0])
	&& array_contains(n_query.extras.venn.cell_types, state.venn.table_cell_types[1])) {
	n_query.extras["table_cell_types"] = state.venn.table_cell_types;
    }
    return n_query;
}

export const invalidate_comparison = (state) => {
    return (dispatch) => {

	var f_success = (response, status, jqxhr) => {
	    ResultsDispatchMap(state, response.results, dispatch);
	    dispatch(set_venn_results(response.results.venn));
	    dispatch(set_table_results(response.sep_results));
	    dispatch(results_done());
	    dispatch(set_searchtext(FacetsToSearchText(state)));
	};

	var c_success = (response, status, jqxhr) => {
	    Object.keys(response.sep_results).map((k) => {
		response.sep_results[k].results.hits.map((d) => {
		    if (!(d._source.position.chrom) in response) return;
		    response[d._source.position.chrom].cytobands.push({
			feature: k,
			start: d._source.position.start,
			end: d._source.position.end
		    });
		})
	    });
	    dispatch({type: SET_SPEARMAN, chrom_spearman: response});
	};
	
	var f_error = (jqxhr, status, error) => {
	    dispatch(results_error(jqxhr, error));
	};

	dispatch(results_loading());
	QueryAJAX(get_query(state), f_success, f_error);
	ChrAJAX(get_query(state), c_success, f_error);
	
    }
};
