import {MATCH_MODE_ALL, MATCH_MODE_ANY, SET_ITEMS} from '../../../common/reducers/checklist'

export const TFQueryMap = (key, facet, query) => {

    var key = (facet.state.mode == MATCH_MODE_ALL ? "must" : "should");
    var retval = {bool: {}};
    retval.bool[key] = [];

    for (var i in facet.state.items) {
	if (!facet.state.items[i].checked) continue;
	retval.bool[key].push({
	    "exists": {
		"field": "peak_intersections.tf." + facet.state.items[i].value
	    }
	});
    }

    if (retval.bool[key].length > 0) {
	query.query.bool.must.push(retval);
    }
    
};
