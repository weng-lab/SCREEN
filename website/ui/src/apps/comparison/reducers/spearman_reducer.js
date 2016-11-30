export const SET_THRESHOLD = 'SET_THRESHOLD';
export const SET_VENN_RESULTS = 'SET_VENN_RESULTS';
export const SET_TABLE_CELL_TYPES = 'SET_TABLE_CELL_TYPES';

const default_state = {
    diagram_width: 500,
    diagram_height: 500,
    results: {
	totals: {},
	overlaps: {}
    },
    threshold: 1000,
    table_cell_types: []
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
		matrix: action.results.matrix,
		table_cell_types: [action.results.rowlabels[0], action.results.rowlabels[1]]
	    }
	});

    case SET_TABLE_CELL_TYPES:
	return Object.assign({}, state, {
	    table_cell_types: action.table_cell_types
	});
    }
    
    return state;
    
};
export default VennReducer;
