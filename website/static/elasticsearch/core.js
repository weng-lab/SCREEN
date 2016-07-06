var POSITION_CHROM   = 0;
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

function rank_aggs(cell_line) {

    return {
	"dnase_rank": {"histogram": {"field": "ranks.dnase." + cell_line + ".rank",
				      "interval": 500,
				      "min_doc_count": 1}},
	"promoter_rank": {"histogram": {"field": "ranks.promoter." + cell_line + ".rank",
					 "interval": 500,
					 "min_doc_count": 1}},
	"enhancer_rank": {"histogram": {"field": "ranks.enhancer." + cell_line + ".rank",
					 "interval": 500,
					 "min_doc_count": 1}},
	"ctcf_rank": {"histogram": {"field": "ranks.ctcf." + cell_line + ".rank",
				     "interval": 500,
				     "min_doc_count": 1}},
	"conservation": {"histogram": {"field": "ranks.conservation",
				       "interval": 500,
				       "min_doc_count": 1}}
    };
    
};

function Query() {

    this.cell_line = "";
    this.chromosome = "";
    
    this.eso = {
	"aggs": {
	    "chromosome": {"terms": {"field": "position.chrom"}},
	    "coordinates": {"histogram": {"field": "position.start",
					  "interval": 2000000,
					  "min_doc_count": 1}},
	    "gene_distance": {"histogram": {"field": "gene.nearest-all.distance",
					    "interval": 50000,
					    "min_doc_count": 1}},
	    "pcgene_distance": {"histogram": {"field": "gene.nearest-pc.distance",
					      "interval": 50000,
					      "min_doc_count": 1}},
	    "cell_lines": {"terms": {"field": "ranks.dnase"}}
	},
	"query": {
	    "bool": {
		"must": [
		    {} // position.chrom
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

Query.prototype.get_coordinate_selection_range = function() {
    if (this.eso.query.bool.must[POSITION_END] == {}) return null;
    return [this.eso.query.bool.must[POSITION_END].range["position.start"].gte,
	    this.eso.query.bool.must[POSITION_START].range["position.end"].lte];
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
}

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
    this.set_filter_generic(lbound, ubound, CONSERVATION_RNK, "ranks.conservation");
};

searchquery = new Query();

function perform_search()
{
    sendText(JSON.stringify(searchquery.eso));
};

function request_cell_lines()
{
    sendText(JSON.stringify(cell_line_request));
};
