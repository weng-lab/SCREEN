var $ = require('jquery');

export const ExpressionBoxplotAJAX = (query, f_success, f_error) => {
    console.log("ExpressionBoxplotAJAX", query);
    $.ajax({
	type: "POST",
	url: '/geneexpjson',
        data: query,
        dataType: "json",
        contentType : "application/json",
        success: f_success,
	error: f_error
    });
};
