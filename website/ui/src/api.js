import axios from 'axios';

const url = 'http://megatux.purcaro.com:9002/ver4/search/autocomplete';

export const fetchTodos = (userQuery) => {

    $.ajax({
	url: url,

	// The name of the callback parameter, as specified by the YQL service
	jsonp: "callback",

	// Tell jQuery we're expecting JSONP
	dataType: "jsonp",

	// Tell YQL what we want and that we want JSON
	data: {userQuery},

	// Work with the response
	success: function( response ) {
	    console.log( response ); // server response
	}
    });


    return axios.post(url, {userQuery});
};
