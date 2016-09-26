/*
 *  This function maps the store's current state to an elasticsearch query
 *  It operates only on *visible* facetboxes and *visible* facets within them
 *
 *  In order to be added to the query, facets must be bound to a mapping method (es_map)
 *  This should be set by dipatching the ES_CONNECT action (see ./es_connect.js)
 */
const FacetQueryMap = (state) => {
    
    var retval = {
	size: 500,
	aggs: {},
	query: {
	    bool: {
		must: []
	    }
	},
	post_filter: {
	    bool: {
		must: []
	    }
	},
	extras: {}
    };

    for (var i in state.facet_boxes) {
	
	var tbox = state.facet_boxes[i];
	var visible = (tbox.display_map ? tbox.display_map(state) : tbox.visible);
	if (!visible) continue;

	for (var key in tbox.facets) {
	    
	    var tfacet = Object.assign({}, tbox.facets[key]);
	    if (!tfacet.visible || tfacet.es_map == null) continue;
	    if (typeof(tfacet.es_field) === 'function') tfacet.es_field = tfacet.es_field(state);
	    tfacet.es_map(key, tfacet, retval);
	    
	}
	
    }

    return retval;

}
export default FacetQueryMap;
