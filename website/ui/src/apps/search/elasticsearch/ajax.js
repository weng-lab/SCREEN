var $ = require('jquery');
import {AJAX_URL} from '../config/constants'

const format_query = (query) => {
    var eso = Object.assign({}, query);
    delete eso.extras;
    return JSON.stringify({
	action: "query",
	q: eso,
	post_processing: query.extras
    });
};

const QueryAJAX = (query, f_success, f_error) => {
    $.ajax({
        type: "POST",
        url: AJAX_URL,
        data: format_query(query),
        dataType: "json",
        contentType : "application/json",
        success: f_success,
	error: f_error
    });
};
export default QueryAJAX;
