var $ = require('jquery');
import {AJAX_URL} from '../../search/config/constants'

const format_query = (query, action = "venn") => {
    var eso = Object.assign({}, query);
    delete eso.extras;
    return JSON.stringify(Object.assign({
	action,
	object: eso
    }, query.extras));
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

export const ChrAJAX = (query, f_success, f_error) => {
    $.ajax({
	type: "POST",
	url: AJAX_URL,
	data: format_query(query, "venn_chr"),
	dataType: "json",
	contentType: "application/json",
	success: f_success,
	error: f_error
    });
};
