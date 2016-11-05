export const UPDATE_HEATMAP = 'UPDATE_HEATMAP';
export const SET_LOADING = 'SET_LOADING';
export const SET_COMPLETE = 'SET_COMPLETE';

export let heatmap_default_state = {
    matrix: {},
    title: "",
    collabels: [],
    rowlabels: [],
    loading: false
};

export function VerticalBarReducer(state = heatmap_default_state, action) {

    if (action == null) return state;
    
    switch (action.type) {

    case UPDATE_HEATMAP:
	return Object.assign({}, state, {
	    matrix: action.matrix,
	    collabels: action.collabels,
	    rowlabels: action.rowlabels
	});
	
    }

    return state;
    
};
export default VerticalBarReducer;
