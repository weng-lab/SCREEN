/*
 *  This function maps the store's current state to an elasticsearch query
 *  It operates only on *visible* facetboxes and *visible* facets within them
 *
 *  In order to be added to the query, facets must be bound to a mapping method (es_map)
 *  This should be set by dipatching the ES_CONNECT action (see ./es_connect.js)
 */
const FacetQueryMap = (state) => {
    
    var retval = {
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
	"extras": {} // this field can hold args for CherryPy which will be stripped before the query is sent to ES
    };

    for (var i in state.facet_boxes) {
	
	var tbox = state.facet_boxes[i];
	if (!tbox.visible) continue;

	for (var key in tbox.facets) {
	    
	    var tfacet = tbox.facets[key];
	    if (!tfacet.visible || tfacet.es_map == null) continue;
	    tfacet.es_map(key, tfacet, retval);
	    
	}
	
    }

    return retval;

}
export default FacetQueryMap;
