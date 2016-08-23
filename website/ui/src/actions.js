import * as api from './api';
import { getIsFetching } from './reducers';

export const fetchTodos = (userQuery) => (dispatch, getState) => {
    dispatch({
	type: 'SEARCH_KEY_PRESS',
	userQuery,
    });

    if(getIsFetching(getState(), userQuery)){
	return Promise.resolve();
    }

    dispatch({
	type: 'FETCH_TODOS_REQUEST',
	userQuery,
    });
    
    return api.fetchTodos(userQuery).then(
	response =>{
	    dispatch({
		type: 'FETCH_TODOS_SUCCESS',
		response,
		userQuery
	    })
	},
	error => {
	    dispatch({
		type: 'FETCH_TODOS_FAILURE',
		userQuery,
		message: error.message || 'Something went wrong.'
	    });
	}
    );
};

export const toggleTodo = (id) => ({
    type: 'TOGGLE_TODO',
    id
});
