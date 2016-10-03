function AJAXClient(url)
{

    this.url = url;
    
    this._send_json = function(q, f, e = null) {
	
	var m = JSON.stringify(q);
	
	$.ajax({
            type: "POST",
            url: this.url,
            data: m,
            dataType: "json",
            contentType : "application/json",
            success: f,
	    error: function(XMLHttpRequest, textStatus, errorThrown) {
		console.log("ERROR performing AJAX request\nStatus: " + textStatus + "\nError:" + errorThrown);
		console.log(XMLHttpRequest);
		if (e) e(XMLHttpRequest, textStatus, errorThrown);
	    }
	});
	
    };

    this.send_es_query = function(q, f) {
	q = {
	    "action": "query",
	    "q": q.eso
	};
	this._send_json(q, f);
    };

    this.gene_expression_search = function(ids, f) {
	var q = {
	    "action": "gene_expression",
	    "ids": ids
	};
	this._send_json(q, f);
    };

    this.get_peaks = function(q, f) {
	q = {
	    "action": "peak_detail",
	    "accession": q.accession,
	    "coord": q.position
	};
	this._send_json(q, f);
    };

    this.get_cell_lines = function(f) {
	var q = {
	    "action": "query",
	    "index": REjsonIndex,
	    "callback": "element",
	    "name": "cell_line",
	    "field": "ranks.dnase"
	};
    };
    
    this.get_re_details = function(q, f) {
	q = {
	    "action": "re_detail",
	    "accession": q.accession,
	    "coord": q.position
	};
	this._send_json(q, f);
    };

    this.get_venn = function(cell_lines, rank_id, threshold, f) {
	q = {
	    "action": "venn",
	    "cell_lines": cell_lines,
	    "rank_id": rank_id
	    "threshold": threshold
	};
	this._send_json(q, f);
    };
    
};

function ElasticSearchQuery()
{

    this.eso = {
	"from": 0,
	"size": 10,
	"aggs": {},
	"query": {
	    "bool": {
		"must": []
	    }
	},
	"post_filter": {
	    "bool": {
		"must": []
	    }
	}
    };

    this.set_n_results = function(n) {
	if (n < 10) n = 10;
	this.eso.size = n;
    };

    this.set_start_index = function(i) {
	if (i < 0) i = 0;
	this.eso.from = i;
    };

    this._append_agg = function(o) {
	this.eso.aggs.push(o);
    };

    this._remove_agg = function(o) {
	for (i in this.eso.aggs) {
	    if (this.eso.aggs[i] == o) this.eso.aggs.splice(i, 1);
	}
    };
    
    this._append = function(a, o) {
	if (!(a in this.eso) || !("bool" in this.eso[a]) || !("must" in this.eso[a].bool)) return;
	this.eso[a].bool.must.push(o);
    };

    this._remove = function(a, o) {
	if (!(a in this.eso) || !("bool" in this.eso[a]) || !("must" in this.eso[a].bool)) return;
	for (i in this.eso[a].bool.must) {
	    if (this.eso[a].bool.must[i] == o) this.eso[a].bool.must.splice(i, 1);
	}
    };

    this.append_terms_agg = function(id, field, size = 0) {
	var agg = {};
	agg[id] = {
	    "terms": {
		"field": field,
		"size": size
	    }
	};
	this._append_agg(agg);
	return agg;
    };

    this.append_histogram_agg = function(id, field, interval, min_doc_count = 1) {
	var agg = {};
	agg[id] = {
	    "histogram": {
		"field": field,
		"interval": interval,
		"min_doc_count": min_doc_count
	    }
	};
	this._append_agg(agg);
	return agg;
    };

    this._append_exists_q = function(a, field) {
	var o = {
	    "exists": {
		"field": field
	    }
	};
	this._append(a, o);
	return o;
    };

    this.append_range_q = function(a, field, lbound = null, ubound = null) {
	if (lbound == null && ubound == null) return;
	var o = {
	    "range": {}
	};
	o.range[field] = {};
	if (lbound != null) o.range[field].gte = +lbound;
	if (ubound != null) o.range[field].lte = +ubound;
	this._append(a, o);
	return o;
    };

    this.append_match_q = function(a, field, value) {
	var o = {
	    "match": {}
	};
	o.match[field] = value;
	this._append(a, o);
	return o;
    };
    
    this.append_exists_query = function(field) {
	return this.append_exists_q("query", field);
    };

    this.append_exists_post_filter = function(field) {
	return this.append_exists_q("post_filter", field);
    };

    this.append_range_query = function(field, lbound = null, ubound = null) {
	return this.append_range_q("query", field, lbound, ubound);
    };

    this.append_range_post_filter = function(field, lbound = null, ubound = null) {
	return this.append_range_q("post_filter", field, lbound, ubound);
    };
    
    this.append_match_query = function(field, value) {
	return this.append_match_q("query", field, value);
    };

    this.append_match_post_filter = function(field, value) {
	return this.append_match_q("post_filter", field, value);
    };

    this.append_sort_term = function(field, order = null) {
	var o = field;
	if (order != null) {
	    o = {};
	    o[field] = order;
	}
	this.eso.sort.push(o);
    };

    this.remove_sort_term = function(o) {
	for (i in this.eso.sort) {
	    if (this.eso.sort[i] == o) this.eso.sort.splice(i, 1);
	}
    };
    
};
