import { getIsFetching } from '../reducers';
import axios from 'axios'; 

export const fetchTodos = (filter) => (dispatch, getState) => {
    if (getIsFetching(getState(), filter)) {
	return Promise.resolve();
    }

    dispatch({
	type: 'FETCH_TODOS_REQUEST',
	filter,
    });

    return axios.post('http://megatux.purcaro.com:9002/ver4/search/autocomplete', {
	userQuery: filter
    }).then(function (response) {
	console.log(response);
	dispatch({
            type: 'FETCH_TODOS_SUCCESS',
            filter,
            response: normalize(response, schema.arrayOfTodos),
	});
    }).catch(function (error) {
	console.log(error);
	dispatch({
            type: 'FETCH_TODOS_FAILURE',
            filter,
            message: error.message || 'Something went wrong.',
	});
    });
};
