import {combineReducers }  from 'redux';
import byIdReducer, * as fromById from './byId';
import createList, * as fromList from './createList';
import search from './search';

const sugsByUserQuery = (state = {}, action) =>{
    switch(action.type){
    case 'SEARCH_KEY_PRESS':
	if (action.userQuery in state){
	    return state;
	}
	
        const nextState = { ...state };
	nextState[action.userQuery] = createList(undefined, action);
	return nextState;
    default:
	return state;
    }
};

export const todoApp = combineReducers({
    sugsByUserQuery,
    search
});

// aka selector
export const getSugs = (state, userQuery) => {
    if('' == userQuery){
	return [];
    }
    return fromList.getSugs(state.sugsByUserQuery[userQuery]);
};

export const getIsFetching = (state, userQuery) => {
    if('' == userQuery){
	return false;
    }
    return fromList.getIsFetching(state.sugsByUserQuery[userQuery]);
}

export const getErrorMessage = (state, userQuery) => {
    if('' == userQuery){
	return [];
    }
    fromList.getErrorMessage(state.sugsByUserQuery[userQuery]);
}

