import {SET_DATA} from '../../../common/reducers/vertical_bar'
import {VERTICAL_BAR} from '../helpers/create_results_display'

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

export const results_displays = {
    tss_box: {
	type: VERTICAL_BAR,
	data: [],
	title: "Distance to TSS",
	xlabels: ["<2.5k", "2.5k-10k", "10k-50k", "50k-250k", "250k-500k", "500k-1m", ">1m"],
	width: 500,
	height: 300,
	loading: false,
	append_query: (query_obj) => {
	    query_obj.aggs[TSS_AGG_KEY] = tss_agg;
	    query_obj.extras["tss_bins"] = tss_pp;
	},
	dispatch_result: (results, dispatch) => {dispatch({
	    type: SET_DATA,
	    data: results["tss_histogram"]
	})}
    }
}
