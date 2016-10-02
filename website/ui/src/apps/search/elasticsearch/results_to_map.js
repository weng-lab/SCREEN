import {FACET_ACTION} from '../reducers/facetbox_reducer'
import {FACETBOX_ACTION} from '../reducers/root_reducer'
import {facet_dispatch, facetbox_dispatch} from '../helpers/actions'
import toggle_facetbox from '../helpers/toggle_facetbox'

/*
 *  This function maps the results from AJAX to appropriate dispatch calls to update the store
 *  It also toggles facetbox visibility based on the facetbox display_map properties
 *
 *  In order for a component of the results to be displayed, they must be bound to a mapping method (es_callback)
 *  This should be set by dipatching the ES_CONNECT action (see ./es_connect.js)
 */
const ResultsDispatchMap = (state, results, dispatch) => {

    console.log(results);
    
    for (var i in state.facet_boxes) {
	
	var tbox = state.facet_boxes[i];
	var visible = (tbox.display_map
		       ? toggle_facetbox(i, tbox.display_map(state), facetbox_dispatch(i, dispatch))
		       : tbox.visible);
	if (!visible) continue;
	if (state.facet_boxes[i].rs_callback != null) {
	    state.facet_boxes[i].rs_callback(i, tbox, facetbox_dispatch(i, dispatch), results);
	}
	
	for (var key in tbox.facets) {
	    
	    var tfacet = Object.assign({}, tbox.facets[key]);
	    if (tfacet.es_callback == null || !tfacet.visible) continue;
	    if (typeof(tfacet.rs_field) === 'function') tfacet.rs_field = tfacet.rs_field(results);
	    tfacet.es_callback(key, tfacet, facet_dispatch(i, key, dispatch), results);
	    
	}
	
    }

}
export default ResultsDispatchMap;
