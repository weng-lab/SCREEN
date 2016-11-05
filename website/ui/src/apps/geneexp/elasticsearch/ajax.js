var $ = require('jquery');
import {GENEEXP_URL} from '../config/constants'

export const ExpressionBoxplotAJAX = (query, f_success, f_error) => {
    console.log("ExpressionBoxplotAJAX", query);
    $.ajax({
	type: "POST",
	url: GENEEXP_URL,
        data: query,
        dataType: "json",
        contentType : "application/json",
        success: f_success,
	error: f_error
    });
};
