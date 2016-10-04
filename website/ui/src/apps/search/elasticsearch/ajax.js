var $ = require('jquery');
import {AJAX_URL} from '../config/constants'

const format_query = (query, action = "search") => {
    var eso = Object.assign({}, query);
    delete eso.extras;
    return JSON.stringify({
	action,
	object: eso,
	post_processing: query.extras
    });
};

const format_detail = (detail_query) => {
    return JSON.stringify(Object.assign(detail_query, {
	action: "re_detail"
    }));
};

const QueryAJAX = (query, f_success, f_error) => {
    console.log(query);
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

export const DetailAJAX = (query, f_success, f_error) => {
    console.log(format_detail(query));
    $.ajax({
	type: "POST",
	url: AJAX_URL,
        data: format_detail(query),
        dataType: "json",
        contentType : "application/json",
        success: f_success,
	error: f_error
    });
};

export const ExpressionAJAX = (query, f_success, f_error) => {
    $.ajax({
	type: "POST",
	url: AJAX_URL,
	data: format_query(query, "gene_expression"),
	dataType: "json",
	contentType: "application/json",
	success: f_success,
	error: f_error
    });
};
