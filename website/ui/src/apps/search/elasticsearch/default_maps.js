import {MATCH_MODE_ALL, MATCH_MODE_ANY, SET_ITEMS} from '../../../common/reducers/checklist'
import {SET_RANGE, SET_HPARAMETERS} from '../../../common/reducers/range'
import {term_match} from './helpers'

export const RangeQueryMap = (key, facet, query) => {
    var range = {};
    range[facet.es_field] = {
	gte: facet.state.selection_range[0],
	lte: facet.state.selection_range[1]
    };
    query.post_filter.bool.must.push({
	range: range
    });
};

export const RangeAggMap = (key, facet, query) => {
    query.aggs[key] = {
	histogram: {
	    field: facet.es_field,
	    interval: facet.state.h_interval,
	    min_doc_count: 1
	}
    };
};

export const ListQueryMap = (key, facet, query) => {
    var term = {};
    if (facet.state.selection == null) return;
    term[facet.es_field] = facet.state.selection;
    query.query.bool.must.push(
	term_match(facet.es_field, facet.state.selection)
    );
};

export const ListAggMap = (key, facet, query) => {
    query.aggs[key] = {
	terms: {
	    field: facet.es_field,
	    size: 100
	}
    };
};

export const ListResultsMap = (key, facet, dispatch, results) => {
    dispatch({
	type: SET_ITEMS,
	items: results.aggs[key].datapairs
    });
};

export const RangeResultsMap = (key, facet, dispatch, results) => {
    dispatch({
	type: SET_RANGE,
	range: [results.aggs[key].minvalue, results.aggs[key].maxvalue]
    });
    dispatch({
	type: SET_HPARAMETERS,
	h_data: results.aggs[key].buckets
    });
};

export const ChecklistQueryMap = (key, facet, query) => {
    
    var key = (facet.state.mode == MATCH_MODE_ALL ? "must" : "should");
    var retval = {bool: {}};
    retval.bool[key] = [];

    for (var i in facet.state.items) {
	console.log(facet.state.items[i]);
	if (!facet.state.items[i].checked) continue;
	retval.bool[key].push(
	    term_match(facet.es_field, facet.state.items[i].value)
	);
    }

    if (retval.bool[key].length > 0) {
	query.query.bool.must.push(retval);
    }
    
};
