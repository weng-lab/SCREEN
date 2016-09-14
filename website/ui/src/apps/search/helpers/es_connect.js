import {FACETBOX_ACTION} from '../reducers/root_reducer'
import {FACET_ACTION} from '../reducers/facetbox_reducer'
export const ES_CONNECT = 'ES_CONNECT';

const compose_maps = (maps) => (key, facet, query) => {
    for (var i in maps) maps[i](key, facet, query);
};

const es_connect = (box) => (key, functions, es_field = null) => {
    return {
	type: FACETBOX_ACTION,
	key: box,
	subaction: {
	    type: FACET_ACTION,
	    key: key,
	    subaction: {
		type: ES_CONNECT,
		f: compose_maps(functions),
		es_field: es_field
	    }
	}
    };
};
export default es_connect;

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
    term[facet.es_field] = facet.state.items[facet.state.selection].value;
    query.query.bool.must.push({
	term: term
    });
};
