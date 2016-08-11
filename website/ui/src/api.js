import axios from 'axios';

//const url = 'http://megatux.purcaro.com:9002/ver4/search/autocomplete';
const url = '/datav4/ver4/search/autocomplete';

export const fetchTodos = (userQuery) => {
    return axios.post(url, {userQuery});
};
