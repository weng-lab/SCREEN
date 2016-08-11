const search = (state = [], action) => {
    switch(action.type){
    case 'SEARCH_KEY_PRESS':
	return action.userQuery;
    default:
	return state;
    }
};

export default search;

export const getSearch = (state) => state;
