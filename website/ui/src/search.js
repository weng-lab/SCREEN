const search = (state = [], action) => {
    switch(action.type){
    case 'SEARCH_KEY_PRESS':
	return action.value;
    default:
	return state;
    }
};

export default search;

export const getUserQuery = (state) => state;
