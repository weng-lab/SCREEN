var POSITION_CHROM   = 0;
var ASSEMBLY = 1;

var POSITION_START   = 0;
var POSITION_END     = 1;
var NEAREST_GENE_ALL = 2;
var NEAREST_GENE_PC  = 3;
var DNASE_RANKS      = 4;
var PROMOTER_RANKS   = 5;
var ENHANCER_RANKS   = 6;
var CTCF_RANKS       = 7;
var CONSERVATION_RNK = 8;

var HISTOGRAM_BINS   = 100;

var cell_line_request = {"action": "enumerate",
			 "index": "regulatory_elements",
			 "doc_type": "element",
			 "name": "cell_line",
			 "field": "ranks.dnase"};

var autocomplete_callbacks = {};

var rank_map = {
    "promoter": PROMOTER_RANKS,
    "enhancer": ENHANCER_RANKS,
    "ctcf": CTCF_RANKS,
    "dnase": DNASE_RANKS
};

function autocomplete_query(q, indeces, callback_f)
{
    var ctime = (new Date()).getTime();
    autocomplete_callbacks[ctime] = callback_f;
    return {"action": "suggest",
	    "indeces": indeces,
	    "q": q,
	    "callback": ctime};
};

function request_venn(venn_queries)
{
    sendText(JSON.stringify({"action": "query",
			     "index": "regulatory_elements",
			     "callback": "venn_handler_both",
			     "object": venn_queries[0]}));
    sendText(JSON.stringify({"action": "query",
			     "index": "regulatory_elements",
			     "callback": "venn_handler_left",
			     "object": venn_queries[2]}));
    sendText(JSON.stringify({"action": "query",
			     "index": "regulatory_elements",
			     "callback": "venn_handler_right",
			     "object": venn_queries[1]}));
};

function get_venn_queries(cell_lines, rank_id)
{
    var clr1 = "ranks." + rank_id + "." + cell_lines[0] + ".rank";
    var clr2 = "ranks." + rank_id + "." + cell_lines[1] + ".rank";
    if (searchquery.eso.post_filter.bool.must[rank_map[rank_id]] == {}) return;
    var threshold = searchquery.eso.post_filter.bool.must[rank_map[rank_id]].range[clr1].lte;
    var retval = [{
	"query": {
	    "bool": {
		"must": [{"range": {}},
			 {"range": {}}]
	    }
	}
    }, {
	"query": {
	    "bool": {
		"must": [{"range": {}}]
	    }
	}
    }, {
	"query": {
	    "bool": {
		"must": [{"range": {}}]		
	    }
	}
    }];
    retval[0].query.bool.must[0].range[clr1] = {"lte": threshold};
    retval[0].query.bool.must[1].range[clr2] = {"lte": threshold};
    retval[1].query.bool.must[0].range[clr1] = {"gte": threshold};
    retval[2].query.bool.must[0].range[clr2] = {"gte": threshold};

    for (var i = 0; i < 3; i++) {
	for (var j = 0; j < searchquery.eso.query.bool.must.length; j++)
	    retval[i].query.bool.must.push(searchquery.eso.query.bool.must[j]);
	retval[i].query.bool.must.push(searchquery.eso.post_filter.bool.must[0]);
	retval[i].query.bool.must.push(searchquery.eso.post_filter.bool.must[1]);
    }
    
    return retval;
};

function rank_aggs(cell_line) {

    return {
	"dnase": {"histogram": {"field": "ranks.dnase." + cell_line + ".rank",
				      "interval": 500,
				      "min_doc_count": 1}},
	"promoter": {"histogram": {"field": "ranks.promoter." + cell_line + ".rank",
					 "interval": 500,
					 "min_doc_count": 1}},
	"enhancer": {"histogram": {"field": "ranks.enhancer." + cell_line + ".rank",
					 "interval": 500,
					 "min_doc_count": 1}},
	"ctcf": {"histogram": {"field": "ranks.ctcf." + cell_line + ".rank",
				     "interval": 500,
				     "min_doc_count": 1}},
	"conservation": {"histogram": {"field": "ranks.conservation.rank",
				       "interval": 500,
				       "min_doc_count": 1}}
    };

};

function gene_expression_query(ensembl_ids)
{

    var retval = {
	"query": {
	    "bool": {
		"should": []
	    }
	}
    };

    for (id in ensembl_ids)
    {
	retval.query.bool.should.push({"match": {"ensembl_id": ensembl_ids[id]}});
    }

    return retval;
    
};

function Query() {

    this.cell_line = "";
    this.chromosome = "";
    this.assembly = "";

    this.post_filter_map = {
	"dnase": DNASE_RANKS,
	"promoter": PROMOTER_RANKS,
	"enhancer": ENHANCER_RANKS,
	"ctcf": CTCF_RANKS,
	"conservation": CONSERVATION_RNK
    }

    this.eso = {
	"from": 0,
	"size": 10,
	"aggs": {
	    "chromosome": {"terms": {"field": "position.chrom",
				     "size": 100}},
	    "coordinates": {"histogram": {"field": "position.start",
					  "interval": 2000000,
					  "min_doc_count": 1}},
	    "gene_distance": {"histogram": {"field": "gene.nearest-all.distance",
					    "interval": 50000,
					    "min_doc_count": 1}},
	    "pcgene_distance": {"histogram": {"field": "gene.nearest-pc.distance",
					      "interval": 50000,
					      "min_doc_count": 1}},
	    "cell_lines": {"terms": {"field": "ranks.dnase"}},
	    "assembly": {"terms": {"field": "genome"}}
	},
	"query": {
	    "bool": {
		"must": [
		    {}, // position.chrom
		    {}  // assembly
		]
	    }
	},
	"post_filter": {
	    "bool": {
		"must": [
		    {}, // position.start
		    {}, // position.end
		    {}, // nearest_all.distance
		    {}, // nearest_pc.distance
		    {}, // dnase ranks
		    {}, // promoter ranks
		    {}, // enhancer ranks
		    {}, // ctcf ranks
		    {} // conservation rank
		]
	    }
	}
    };

};

function array_remove(array, element)
{
    for (i in array) {
	if (array[i] == element) array.splice(index, 1);
    }
    return array;
}

Query.prototype.add_aggregations = function(aggdict) {
    for (agg in aggdict) {
	this.eso.aggs[agg] = aggdict[agg];
    }
};

Query.prototype.set_chromosome_filter = function(chr) {
    this.eso.query.bool.must[POSITION_CHROM] = {"match" : { "position.chrom" : chr } };
    this.chromosome = chr;
};

Query.prototype.set_assembly_filter = function(assembly) {
    if (assembly != this.assembly)
    {
	this.eso.query.bool.must[ASSEMBLY] = {"match": {"genome": assembly}};
	this.assembly = assembly;
    }
    else
    {
	this.eso.query.bool.must[ASSEMBLY] = {};
	this.assembly = "";
    }
};

Query.prototype.set_num_results = function(n) {this.eso.size = n;};

Query.prototype.set_first_result_index = function(i) {this.eso.from = i;};

Query.prototype.get_coordinate_selection_range = function() {
    if (this.eso.post_filter.bool.must[POSITION_END] == {}) return null;
    return [this.eso.post_filter.bool.must[POSITION_END].range["position.end"].gte,
	    this.eso.post_filter.bool.must[POSITION_START].range["position.start"].lte];
};

Query.prototype.has_chromosome_filter = function() {return this.chromosome != ""};

Query.prototype.has_cell_line_filter = function() {return this.cell_line != ""};

Query.prototype.set_coordinate_filter = function(chrom, start, end) {
    if (chrom != "")
    {
	this.chromosome = chrom;
	this.eso.query.bool.must[POSITION_CHROM] = {"match" : { "position.chrom" : chrom } };
	this.eso.post_filter.bool.must[POSITION_START]  = {"range" : { "position.start" : { "lte" : +end } } };
	this.eso.post_filter.bool.must[POSITION_END]    = {"range" : { "position.end" : { "gte" : +start } } };
    }
    else
    {
	this.chromosome = "";
	this.eso.query.bool.must[POSITION_CHROM] = {};
	this.eso.post_filter.bool.must[POSITION_START] = {};
	this.eso.post_filter.bool.must[POSITION_END] = {};
    }
};

Query.prototype.remove_aggregations = function(aggdict) {
    for (agg in aggdict) {
	array_remove(this.eso.aggs, aggdict[agg]);
    }
};

Query.prototype.remove_rank_filters = function() {
    for (var i = 4; i <= 8; i++) this.eso.post_filter.bool.must[i] = {};
};

Query.prototype.set_cell_line_filter = function(cell_line) {
    if (this.cell_line == "")
    {
	this.eso.query.bool.must.push({"exists": {"field": "ranks.dnase." + cell_line}});
	this.add_aggregations(rank_aggs(cell_line));
	this.cell_line = cell_line;
    }
    else
    {
	array_remove(this.eso.query.bool.must, {"exists": {"field": "ranks.dnase." + cell_line}});
	this.remove_aggregations(rank_aggs(cell_line));
	this.cell_line = "";
	this.remove_rank_filters();
    }
};

Query.prototype.set_gene_distance_filter = function(lbound, ubound) {
    this.set_filter_generic(lbound, ubound, NEAREST_GENE_ALL, "gene.nearest-all.distance");
};

Query.prototype.set_filter_generic = function(lbound, ubound, i, name) {
    this.eso.post_filter.bool.must[i]["range"] = {};
    this.eso.post_filter.bool.must[i]["range"][name] = {"gte": +lbound,
							"lte": +ubound};
};

Query.prototype.set_enhancer_filter_preset = function() {
    this.set_filter_generic(0, 20000, ENHANCER_RANKS, "ranks.enhancer." + this.cell_line + ".rank");
    this.set_filter_generic(20000, 100000000, PROMOTER_RANKS, "ranks.promoter." + this.cell_line + ".rank");
    this.set_filter_generic(20000, 100000000, CTCF_RANKS, "ranks.ctcf." + this.cell_line + ".rank");
};

Query.prototype.set_promoter_filter_preset = function () {
    this.set_filter_generic(0, 20000, PROMOTER_RANKS, "ranks.promoter." + this.cell_line + ".rank");
    this.set_filter_generic(0, 20000, DNASE_RANKS, "ranks.dnase." + this.cell_line + ".rank")
    this.set_filter_generic(20000, 100000000, CTCF_RANKS, "ranks.ctcf." + this.cell_line + ".rank");
};

Query.prototype.set_insulator_filter_preset = function () {
    this.set_filter_generic(0, 20000, CTCF_RANKS, "ranks.ctcf." + this.cell_line + ".rank");
    this.set_filter_generic(20000, 100000000, PROMOTER_RANKS, "ranks.promoter." + this.cell_line + ".rank");
};

Query.prototype.set_pcgene_distance_filter = function(lbound, ubound) {
    this.set_filter_generic(lbound, ubound, NEAREST_GENE_PC, "gene.nearest-pc.distance");
};

Query.prototype.set_dnase_rank_filter = function(lbound, ubound) {
    this.set_filter_generic(lbound, ubound, DNASE_RANKS, "ranks.dnase." + this.cell_line + ".rank");
};

Query.prototype.set_promoter_rank_filter = function(lbound, ubound) {
    this.set_filter_generic(lbound, ubound, PROMOTER_RANKS, "ranks.promoter." + this.cell_line + ".rank");
};

Query.prototype.set_enhancer_rank_filter = function(lbound, ubound) {
    this.set_filter_generic(lbound, ubound, ENHANCER_RANKS, "ranks.enhancer." + this.cell_line + ".rank");
};

Query.prototype.set_ctcf_rank_filter = function(lbound, ubound) {
    this.set_filter_generic(lbound, ubound, CTCF_RANKS, "ranks.ctcf." + this.cell_line + ".rank");
};

Query.prototype.set_conservation_filter = function(lbound, ubound) {
    this.set_filter_generic(lbound, ubound, CONSERVATION_RNK, "ranks.conservation.rank");
};

searchquery = new Query();

function perform_search()
{
    sendText(JSON.stringify({"action": "query",
			     "callback": "regulatory_elements",
			     "index": "regulatory_elements",
			     "object": searchquery.eso}));
};

function perform_gene_expression_search(obj)
{
    sendText(JSON.stringify({"action": "query",
			     "callback": "expression_matrix",
			     "index": "expression_matrix",
			     "object": obj}));
};

function request_cell_lines()
{
    sendText(JSON.stringify(cell_line_request));
};

function request_suggestions(q, indeces, callback_f)
{
    sendText(JSON.stringify(autocomplete_query(q, indeces, callback_f)));
};
