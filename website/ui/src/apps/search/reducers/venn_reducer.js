export const SET_THRESHOLD = 'SET_THRESHOLD';
export const SET_VENN_RESULTS = 'SET_VENN_RESULTS';

const default_state = {
    diagram_width: 500,
    diagram_height: 500,
    results: {
	totals: {},
	overlaps: {}
    },
    threshold: 1000
};

const VennReducer = (state = default_state, action) => {

    if (action == null || !("type" in action)) return state;

    switch (action.type) {
    case SET_THRESHOLD:
	return Object.assign({}, state, {
	    threshold: action.threshold
	});

    case SET_VENN_RESULTS:
	return Object.assign({}, state, {
	    results: {
		totals: action.results.totals,
		overlaps: action.results.overlaps,
		rowlabels: action.results.rowlabels,
		collabels: action.results.collabels,
		matrix: action.results.matrix
	    }
	});
    }
    
    return state;
    
};
export default VennReducer;
