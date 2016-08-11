import {combineReducers }  from 'redux';

const createList = (userQuery) => {
    const sugs = (state = [], action) => {
	if(action.userQuery !== userQuery){
	    return state;
	}
	switch(action.type){
	case 'FETCH_TODOS_SUCCESS':
	    return action.response;
	default:
	    return state;
	}
    };

    const isFetching = (state = false, action) => {
	if(action.userQuery !== userQuery){
	    return state;
	}
	switch(action.type){
	case 'FETCH_TODOS_REQUEST':
	    return true;
	case 'FETCH_TODOS_SUCCESS':
	case 'FETCH_TODOS_FAILURE':
	    return false;
	default:
	    return state; 
	}
    };

    const errorMessage = (state = null, action) => {
	if(action.userQuery !== userQuery){
	    return state;
	}
	switch(action.type){
	case 'FETCH_TODOS_FAILURE':
	    return action.message;
	case 'FETCH_TODOS_REQUEST':
	case 'FETCH_TODOS_SUCCESS':
	    return null;
	default:
	    return state;
	}
    };
    
    return combineReducers({
	sugs,
	isFetching,
	errorMessage
    });
};

export default createList;

export const getSugs = (state) =>  state.sugs;

export const getIsFetching = (state) => state.isFetching;

export const getErrorMessage = (state) => state.errorMessage;

