import axios from 'axios';
var querystring = require('querystring');
var qs = require('qs');

const url = 'http://megatux.purcaro.com:9006/ver4/search/autocomplete';

export const fetchTodos = (userQuery) => {
    return axios.post(url, querystring.stringify({
	"userQuery" : userQuery
    }));
};
