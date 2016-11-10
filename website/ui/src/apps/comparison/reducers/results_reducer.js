export const SET_TABLE_RESULTS = 'SET_RESULTS';
export const SET_RESULTS_LOADING = 'SET_LOADING';
export const SET_RESULTS_COMPLETE = 'SET_COMPLETE';

export const default_formatter = (table_layout) => (results) => (Object.keys(results).map((k) => Object.assign({}, table_layout, {
    title: k,
    data: results[k].results.hits,
    total: results[k].results.total
})));

const render_order = (results) => {
    var retval = ["both cell types"];
    Object.keys(results).map((k) => {
	if (k != "both cell types") retval.push(k);
    });
    return retval;
}

const results_default_state = {
    tables: [],
    loading: false,
    onTdClick: null
};

const ResultsReducer = (results_formatter) => (state = results_default_state, action) => {

    if (action == null) return state;

    switch (action.type) {
    case SET_TABLE_RESULTS:
	return Object.assign({}, state, {
	    tables: results_formatter(action.results),
	    render_order: render_order(action.results)
	});

    case SET_RESULTS_LOADING:
	return Object.assign({}, state, {
	    loading: true
	});

    case SET_RESULTS_COMPLETE:
	return Object.assign({}, state, {
	    loading: false
	});
    }
    
    return state;
    
}
export default ResultsReducer;
