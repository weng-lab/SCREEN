export const SET_VALUE = 'SET_VALUE';

export const searchbox_default_state = {
    value: ""
};

const SearchBoxReducer = (state = searchbox_default_state, action = null) => {

    if (action == null) return state;

    switch (action.type) {
    case SET_VALUE:
	return Object.assign({}, state, {
	    value: action.value
	});
    }
    
    return state;
    
};
export default SearchBoxReducer;
