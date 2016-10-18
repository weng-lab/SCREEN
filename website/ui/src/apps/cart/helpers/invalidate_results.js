import QueryAJAX, {DetailAJAX, ExpressionAJAX, VennAJAX} from '../../search/elasticsearch/ajax'
import {results_done, set_venn_cell_lines, set_table_results, update_expression, results_error, results_fetching} from '../../search/helpers/invalidate_results'

const getquery = (accs) => {
    var retval = {
	query: {
	    bool: {
		should: []
	    }
	}
    };
    for (var i in accs) {
	retval.query.bool.should.push({
	    match: {
		accession: accs[i]
	    }
	});
    }
    return retval;
};

export const invalidate_results = (state) => (dispatch) => {

    var n_query = getquery(state.acc_list);
    console.log("QUERY");
    console.log(n_query);
    
    var e_success = (response, status, jqxhr) => {
	dispatch(update_expression(response.expression_matrix));
    };
    var f_success = (response, status, jqxhr) => {
	console.log(response);
	ExpressionAJAX(n_query, e_success, f_error);
	dispatch(set_table_results(response.results.hits));
	dispatch(results_done(response));
	dispatch(set_venn_cell_lines(response.aggs.cell_lines));
    };
    var f_error = (jqxhr, status, error) => {
	dispatch(results_error(jqxhr, error));
    };
    
    dispatch(results_fetching());
    QueryAJAX(n_query, f_success, f_error);
    
};
