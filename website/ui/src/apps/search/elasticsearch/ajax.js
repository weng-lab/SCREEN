var $ = require('jquery');
import {AJAX_URL} from '../config/constants'

const format_tree_query = (query, outer, inner) => {
    var retval = JSON.parse(format_query(query, "tree"));
    return JSON.stringify(Object.assign({}, retval, {
	outer,
	inner
    }));
};

export const format_query = (query, action = "search") => {
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

const format_detail_gene = (detail_gene_query) => {
    return JSON.stringify(Object.assign(detail_gene_query, {
	action: "re_genes"
    }));
};

const format_venn = (venn_query) => {
    return JSON.stringify(Object.assign(venn_query, {
	action: "venn"
    }));
};

const format_tc_query = (query) => {
    return JSON.stringify(Object.assign({}, query, {
	action: "tree_comparison"
    }));
}

export const TreeComparisonAJAX = (query, f_success, f_error) => {
    console.log(query);
    console.log(format_tc_query(query));
    $.ajax({
        type: "POST",
        url: AJAX_URL,
        data: format_tc_query(query),
        dataType: "json",
        contentType : "application/json",
        success: f_success,
	error: f_error
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

export const DetailAJAX = (query, f_success, f_error) => {
    //console.log(format_detail(query));
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

export const TreeAJAX = (query, outer, inner, f_success, f_error) => {
    $.ajax({
	type: "POST",
	url: AJAX_URL,
	data: format_tree_query(query, outer, inner),
	dataType: "json",
	contentType: "application/json",
	success: f_success,
	error: f_error
    });
};

export const DetailGeneAJAX = (query, f_success, f_error) => {
    $.ajax({
	type: "POST",
	url: AJAX_URL,
	data: format_detail_gene(query),
	dataType: "json",
	contentType: "application/json",
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

export const VennAJAX = (query, f_success, f_error) => {
    $.ajax({
	type: "POST",
	url: AJAX_URL,
	data: format_venn(query),
	dataType: "json",
	contentType: "application/json",
	success: f_success,
	error: f_error
    });
};

