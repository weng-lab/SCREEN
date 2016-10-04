import {MATCH_MODE_ALL, MATCH_MODE_ANY, SET_ITEMS} from '../../../common/reducers/checklist'
import {SET_RANGE, SET_HPARAMETERS} from '../../../common/reducers/range'
import {SET_DATA} from '../../../common/reducers/longlist'
import {HIDE_FACET, SHOW_FACET} from '../reducers/facet_reducer'
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
    if (facet.state.selection == null) return;
    query.query.bool.filter.push(
	term_match(facet.es_field, facet.state.selection)
    );
};

export const LongListQueryMap = (key, facet, query) => {
    if (facet.state.selection == null) return;
    query.query.bool.filter.push(
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

export const LongListResultsMap = (key, facet, dispatch, results) => {
    dispatch({
	type: SET_DATA,
	data: results.aggs[key]
    });
};

export const RangeResultsMap = (key, facet, dispatch, results) => {
    if (results.aggs[key].type == "histogram") {
	dispatch({
	    type: SET_RANGE,
	    range: [results.aggs[key].minvalue, results.aggs[key].maxvalue]
	});
	dispatch({
	    type: SET_HPARAMETERS,
	    h_data: results.aggs[key].buckets
	});
	dispatch({
	    type: SHOW_FACET
	});
    } else {
	dispatch({
	    type: HIDE_FACET
	});
    }
}
    

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
	query.query.bool.filter.push(retval);
    }
    
};
