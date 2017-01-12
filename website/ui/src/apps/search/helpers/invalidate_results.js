import {ExpressionBoxplotAJAX} from '../../geneexp/helpers/ajax'
import {expression_boxplot_loading, expression_boxplot_done, update_expression_boxplot} from '../../geneexp/helpers/invalidate_results'
import QueryAJAX, {TreeAJAX, DetailAJAX, ExpressionAJAX, DetailGeneAJAX, TreeComparisonAJAX} from '../elasticsearch/ajax'
import {RESULTS_FETCHING, RESULTS_DONE, RESULTS_ERROR, SET_TABLE_RESULTS, EXPRESSION_MATRIX_ACTION, DETAILS_DONE,
	DETAILS_FETCHING, UPDATE_DETAIL, SEARCHBOX_ACTION, SET_TREE,
	SET_TREE_COMPARISON, TREE_COMPARISON_LOADING, TREE_COMPARISON_DONE} from '../reducers/root_reducer'
import {UPDATE_EXPRESSION} from '../reducers/expression_matrix_reducer'
import {SET_VALUE} from '../../../common/reducers/searchbox'
import {SET_LOADING, SET_COMPLETE} from '../../../common/reducers/vertical_bar'
import FacetQueryMap, {FacetsToSearchText} from '../elasticsearch/facets_to_query'
import ResultsDispatchMap from '../elasticsearch/results_to_map'
import {asum} from '../../../common/common'

const all_compartments = ["cell", "nucleoplasm", "cytosol", "nucleus", "membrane", "chromatin", "nucleolus"].map(
    (d) => {return {key: d, selected: true}}
);

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

export const update_expression = (expression_matrix, key) => {
    return {
	type: EXPRESSION_MATRIX_ACTION,
	subaction: {
	    type: UPDATE_EXPRESSION,
	    target: key,
	    expression_matrix
	}
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
	type: EXPRESSION_MATRIX_ACTION,
	subaction: {
	    type: SET_LOADING
	}
    }
};

export const expression_done = (response) => {
    return {
	type: EXPRESSION_MATRIX_ACTION,
	subaction: {
	    type: SET_COMPLETE
	}
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

export const invalidate_boxplot = (q) => {
    return (dispatch) => {
	var query = JSON.stringify({
	    geneID : q,
	    compartments: all_compartments
	});
	var f_success = (response, status, jqxhr) => {
	    dispatch(update_expression_boxplot(Object.assign({}, response, {
	    	gene_name: q
	    })));
	    dispatch(expression_boxplot_done(response));
	};
	var f_error = (jqxhr, status, error) => {
            console.log("err invalidate_boxplot");
	    //dispatch(results_error(jqxhr, error));
	};
	dispatch(expression_boxplot_loading());
	ExpressionBoxplotAJAX(query, f_success, f_error);
    }
};

export const invalidate_results = (state) => {
    return (dispatch) => {

	var n_query = FacetQueryMap(state);

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
	    //dispatch(results_error(jqxhr, error));
	    console.log(jqxhr, status, error);
	    console.log("TODO: FIXME");
	};

	var t_success = (response, status, jqxhr) => {
	    console.log(response);
	    dispatch({type: SET_TREE, tree: {tree_results: response.results.tree,
					     tree_title : response.results.tree_title
					    }});
	};

	dispatch(results_fetching());
	QueryAJAX(n_query, f_success, f_error);
	if (state.results.tree)
	    TreeAJAX(n_query, state.results.tree.outer, state.results.tree.inner, t_success, f_error);
	Object.keys(state.results_displays).map((k) => {
	    var r = state.results_displays[k];
	    QueryAJAX(r.append_query(n_query), d_success(k), d_error(k))
	    r.dispatcher(dispatch)({type: SET_LOADING});
	});

    }
};

const tree_comparison_done = (response) => {
    return {
	type: TREE_COMPARISON_DONE
    };
};

const set_tree_comparison = (response) => {
    return {
	type: SET_TREE_COMPARISON,
	response
    };
};

const tree_comparison_loading = () => {
    return {
	type: TREE_COMPARISON_LOADING
    };
};

const get_children = (node) => {
    if (!node.children) return [node.data.name.split("(")[0].replace(/^\s+|\s+$/g, '').replace(/ /g, "_")];
    return asum(node.children.map(get_children));
};

export const invalidate_tree_comparison = ({left, right}) => {
    return (dispatch) => {
	var n_query = {
	    left: get_children(left),
	    right: get_children(right)
	};
	var items = [...n_query.left, ...n_query.right];
	var n_left = ["C57BL-6_forebrain_postnatal_0_days"];
	var n_right = ["C57BL-6_forebrain_embryo_14_5_days"];
	for (var i in items) {
	    if (items[i].includes("hemaatopoi")) n_right.push(items[i]);
	    if (items[i].includes("T-helpear_1")) n_right.push(items[i]);
	}
	n_query = {
	    left: n_left,
	    right: n_right
	};
	var f_success = (response, status, jqxhr) => {
	    dispatch(tree_comparison_done(response));
	    dispatch(set_tree_comparison(response));
	};
	var f_error = (jqxhr, status, error) => {
	    console.log("err invalidate_tree_comparison");
            //dispatch(results_error(jqxhr, error));
	};
	dispatch(tree_comparison_loading());
	TreeComparisonAJAX(n_query, f_success, f_error);
    };
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
	    dispatch(expression_done(response));
	    dispatch(update_detail(response));
	    dispatch(details_done(response));
	    if (response.data.associated_tss && response.data.associated_tss.length > 0) {
		dispatch(invalidate_boxplot(response.data.associated_tss[0]));
	    }
	};
	var g_success = (response, status, jqxhr) => {
	    dispatch(update_detail(response));
	};
	var g_error = (response, status, jqxhr) => {
	    dispatch(results_error(jqxhr, error));
	};
	var f_error = (jqxhr, status, error) => {
	    console.log("err invalidate_detail");
            //dispatch(results_error(jqxhr, error));
	};
	var e_success = (response, status, jqxhr) => {
	};
	dispatch(expression_loading());
	dispatch(details_fetching());
	DetailAJAX(n_query, f_success, f_error);
	DetailGeneAJAX(n_query, g_success, g_error);
    }
};
