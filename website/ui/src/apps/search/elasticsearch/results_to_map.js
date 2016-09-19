/*
 *  This function maps the results from AJAX to appropriate dispatch calls to update the store
 *
 *  In order for a component of the results to be displayed, they must be bound to a mapping method (es_callback)
 *  This should be set by dipatching the ES_CONNECT action (see ./es_connect.js)
 */
const ResultsDispatchMap = (results, dispatch) => {

    for (var i in state.facet_boxes) {
	
	var tbox = state.facet_boxes[i];
	if (state.facet_boxes[i].es_callback != null) {
	    state.facet_boxes[i].es_callback(i, results, dispatch);
	}
	
	for (var key in tbox.facets) {
	    
	    var tfacet = Object.assign({}, tbox.facets[key]);
	    if (tfacet.es_callback == null) continue;
	    if (typeof(tfacet.es_field) === 'function') tfacet.es_field = tfacet.es_field(state);
	    tfacet.es_callback(key, results, dispatch);
	    
	}
	
    }

    return retval;

}
export default ResultsDispatchMap;
