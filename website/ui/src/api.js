import axios from 'axios';

export const fetchTodos = (userQuery) => {
    return axios.post('/data/ver4/search/autocomplete',
		      {userQuery});
};
