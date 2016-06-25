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

var HISTOGRAM_BINS   = 50;

function rank_aggs(cell_line) {

    return {
	"dnase_ranks": {"histogram": {"field": "ranks.dnase." + cell_line + ".rank",
				      "interval": 500,
				      "min_doc_count": 1}},
	"promoter_ranks": {"histogram": {"field": "ranks.promoter." + cell_line + ".rank",
					 "interval": 500,
					 "min_doc_count": 1}},
	"enhancer_ranks": {"histogram": {"field": "ranks.enhancer." + cell_line + ".rank",
					 "interval": 500,
					 "min_doc_count": 1}},
	"ctcf_ranks": {"histogram": {"field": "ranks.ctcf." + cell_line + ".rank",
				     "interval": 500,
				     "min_doc_count": 1}},
	"conservation": {"histogram": {"field": "ranks.conservation",
				       "interval": 10,
				       "min_doc_count": 1}}
    };
    
};

function Query() {

    this.cell_line = "";
    this.chromosome = "";
    
    this.eso = {
	"aggs": {
	    "chromosome": {"terms": {"field": "position.chrom"}},
	    "start": {"histogram": {"field": "position.start",
				    "interval": 2000000,
				    "min_doc_count": 1}},
	    "end": {"histogram": {"field": "position.end",
				  "interval": 2000000,
				  "min_doc_count": 1}},
	    "gene_distance": {"histogram": {"field": "nearest-gene-all.distance",
					    "interval": 50000,
					    "min_doc_count": 1}},
	    "pcgene_distance": {"histogram": {"field": "nearest-gene-pc.distance",
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
		    {}, // nearest-gene-all.distance
		    {}, // nearest-gene-pc.distance
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

Query.prototype.add_aggregations = function(aggdict) {
    for (agg in aggdict) {
	this.eso.aggs[agg] = aggdict[agg];
    }
};

Query.prototype.set_chromosome_filter = function(chr) {
    this.eso.query.bool.must[POSITION_CHROM] = {"match" : { "position.chrom" : chr } };
    this.chromosome = chr;
};

Query.prototype.has_chromosome_filter = function() {return this.chromosome != ""};

Query.prototype.set_coordinate_filter = function(chrom, start, end) {
    this.chromosome = chrom;
    this.eso.query.bool.must[POSITION_CHROM] = {"match" : { "position.chrom" : chrom } };
    this.eso.post_filter.bool.must[POSITION_START]  = {"range" : { "position.start" : { "lte" : +end } } };
    this.eso.post_filter.bool.must[POSITION_END]    = {"range" : { "position.end" : { "gte" : +start } } };
    this.eso.aggs.start.histogram.interval = (end - start) / HISTOGRAM_BINS;
    this.eso.aggs.end.histogram.interval = this.eso.aggs.start.histogram.interval;
};

Query.prototype.set_cell_line_filter = function(cell_line) {
    this.eso.query.bool.must.push({"exists": {"field": "ranks.dnase." + cell_line}});
    this.add_aggregations(rank_aggs(cell_line));
    this.cell_line = cell_line;
};

Query.prototype.set_gene_distance_filter = function(lbound, ubound) {
    this.set_filter_generic(lbound, ubound, NEAREST_GENE_ALL, "nearest-gene-all.distance");
};

Query.prototype.set_filter_generic = function(lbound, ubound, i, name) {
    this.eso.post_filter.bool.must[i]["range"] = {};
    this.eso.post_filter.bool.must[i]["range"][name] = {"gte": +lbound,
							"lte": +ubound};
}

Query.prototype.set_pcgene_distance_filter = function(lbound, ubound) {
    this.set_filter_generic(lbound, ubound, NEAREST_GENE_PC, "nearest-gene-pc.distance");
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
