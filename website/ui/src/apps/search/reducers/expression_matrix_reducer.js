import {default_heatmap_layout} from '../../../common/components/heatmap'

export const UPDATE_EXPRESSION = 'UPDATE_EXPRESSION';
export const SET_LOADING = 'SET_LOADING';
export const SET_COMPLETE = 'SET_COMPLETE';

const default_state = {
    chart_layout: default_heatmap_layout,
    matrices: {},
    loading: false
};

const ExpressionMatrixReducer = (state = default_state, action) => {

    if (action == null) return state;
    
    switch (action.type) {
    case UPDATE_EXPRESSION:
	var matrices = Object.assign({}, state.matrices);
	matrices[action.target] = action.expression_matrix;
	return Object.assign({}, state, {
	    matrices
	});

    case SET_LOADING:
	return Object.assign({}, state, {
	    loading: true
	});

    case SET_COMPLETE:
	return Object.assign({}, state, {
	    loading: false
	});
	
    }

    return state;
    
};
export default ExpressionMatrixReducer;
