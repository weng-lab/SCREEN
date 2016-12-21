var $ = require('jquery');

export const ExpressionBoxplotAJAX = (query, f_success, f_error) => {
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

const format_candidate_re_query = (query) => (
    JSON.stringify(Object.assign(query, {
	"action": "gene_regulators",
	GlobalAssembly
    }))
);

export const CandidateREsAJAX = (query, f_success, f_error) => {
    $.ajax({
	type: "POST",
	url: '/ajaxws',
        data: format_candidate_re_query(query),
        dataType: "json",
        contentType : "application/json",
        success: f_success,
	error: f_error
    });
};
