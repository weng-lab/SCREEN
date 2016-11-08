export const UPDATE_TABLELIST = 'UPDATE_TABLELIST';
export const SET_LOADING = 'SET_LOADING';
export const SET_COMPLETE = 'SET_COMPLETE';

const table_list_default_state = {
    tables: [],
    loading: false
};

const TableListReducer = (state = table_list_default_state, action) {

    if (action == null) return state;

    switch (action.type) {
    case SET_LOADING:
	return Object.assign({}, state, {
	    loading: true
	});

    case SET_COMPLETE:
	return Object.assign({}, state, {
	    loading: false
	});

    case UPDATE_TABLELIST:
	return Object.assign({}, state, {
	    tables: action.tables
	});
	
    }

    return state;
    
};
export default TableListReducer;
