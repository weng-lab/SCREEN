var React = require('react');

import {SET_DATA} from '../../../common/reducers/vertical_bar'
import {UPDATE_HEATMAP} from '../../../common/reducers/heatmap'
import {VERTICAL_BAR, HEATMAP} from '../helpers/create_results_display'

import {DO_NAV} from '../reducers/root_reducer'

const do_nav = (url) => {
    return {
	type: DO_NAV,
	url
    }
};

const TSS_AGG_KEY = "tss_bar";

const tss_agg = {
    "histogram": {
	"field": "genes.nearest-all.distance",
	"interval": 2500
    }
};

const tss_pp = {
    aggkey: TSS_AGG_KEY,
    bins: [2500, 10000, 50000, 250000, 500000, 1000000]
};

const _rank_result_to_heatmap = (result) => {
    var data = [];
    var idx = {"DNase": 1, "Promoter": 2, "Enhancer": 3, "CTCF": 4};
    Object.keys(result).map((k, i) => {
	Object.keys(result[k]).map((_k) => {
	    data.push({col: i + 1, row: idx[_k], value: result[k][_k]});
	})
    });
    return { "collabels": Object.keys(result),
	     "rowlabels": Object.keys(idx),
	     "matrix": data };
    
};

export const results_displays = {
    tss_box: {
	type: VERTICAL_BAR,
	data: [],
	title: "Distance to TSS",
	xlabels: ["<2.5k", "2.5k-10k", "10k-50k", "50k-250k", "250k-500k", "500k-1m", ">1m"],
	width: 500,
	height: 150,
	loading: false,
	footer: "",
	append_query: (query_obj) => {
	    var extras = {};
	    var aggs = {};
	    var query = [...query_obj.query.bool.filter, query_obj.post_filter];
	    aggs[TSS_AGG_KEY] = tss_agg;
	    extras["tss_bins"] = tss_pp;
	    var ret = {
		extras,
		query: Object.assign({}, query_obj.query, {
		    bool: {
			must: query
		    }
		}),
		aggs
	    };
	    //console.log(ret);
	    return ret;
	},
	dispatch_result: (results, dispatch) => {dispatch({
	    type: SET_DATA,
	    data: results["tss_histogram"]
	})}
    },
    rank_heatmap: {
	type: HEATMAP,
	data: [],
	width: 500,
	title: "Activity across tissues",
	loading: false,
	footer: (dispatch) => (<a onClick={() => {dispatch(do_nav("/comparison"))}}>View detailed comparison</a>),
	append_query: (query_obj) => {
	    query_obj.extras["rank_heatmap"] = true;
	    return query_obj;
	},
	dispatch_result: (results, dispatch) => {dispatch(Object.assign({
	    type: UPDATE_HEATMAP
	}, _rank_result_to_heatmap(results["rank_heatmap"])))}
    }
}
