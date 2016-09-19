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

export const ListAggMap = (key, facet, query) => {
    query.aggs[key] = {
	terms: {
	    field: facet.es_field,
	    size: 100
	}
    };
};
