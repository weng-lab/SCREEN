import {SET_ITEMS, SET_AUTOCOMPLETE_SOURCE} from '../../../common/reducers/checklist'
import {CHECKLIST_MATCH_ALL} from '../../../common/components/checklist'

export const TFQueryMap = (key, facet, query) => {
    
    var key = (facet.state.mode == CHECKLIST_MATCH_ALL ? "must" : "should");
    var retval = {bool: {}};
    retval.bool[key] = [];

    for (var i in facet.state.data) {
	if (!facet.state.data[i].selected) continue;
	retval.bool[key].push({
	    "exists": {
		"field": "peak_intersections.tf." + facet.state.data[i].key.toUpperCase()
	    }
	});
    }

    if (retval.bool[key].length > 0) {
	query.query.bool.filter.push(retval);
    }
    
};
