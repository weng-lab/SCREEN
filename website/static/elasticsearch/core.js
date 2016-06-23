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

function Query() {

    this.eso = {
	"aggs": {
	    "chromosome": {"terms": {"field": "position.chrom"}},
	    "start": {"histogram": {"field": "position.start",
				    "interval": 2000000}},
	    "end": {"histogram": {"field": "position.end",
				  "interval": 2000000}},
	    "gene_distance": {"histogram": {"field": "nearest-gene-all.distance",
					    "interval": 50000}},
	    "pcgene_distance": {"histogram": {"field": "nearest-gene-pc.distance",
					      "interval": 50000}},
	    "cell_lines": {"terms": {"field": "ranks.dnase.name"}},
	    "dnase_ranks": {"histogram": {"field": "ranks.dnase.name",
					  "interval": 500}},
	    "promoter_ranks": {"histogram": {"field": "ranks.promoter.name",
					     "interval": 500}},
	    "enhancer_ranks": {"histogram": {"field": "ranks.enhancer.name",
					     "interval": 500}},
	    "ctcf_ranks": {"histogram": {"field": "ranks.ctcf.name",
					 "interval": 500}},
	    "conservation": {"histogram": {"field": "ranks.conservation",
					   "interval": 10}}
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

Query.prototype.set_coordinate_filter = function(chrom, start, end) {
	this.eso.query.bool.must[POSITION_CHROM] = {"match" : { "position.chrom" : chrom } };
	this.eso.post_filter.bool.must[POSITION_START]  = {"range" : { "position.start" : { "lte" : +end } } };
	this.eso.post_filter.bool.must[POSITION_END]    = {"range" : { "position.end" : { "gte" : +start } } };
	this.eso.aggs.start.histogram.interval = (end - start) / HISTOGRAM_BINS;
	this.eso.aggs.end.histogram.interval = this.eso.aggs.start.histogram.interval;
};

Query.prototype.set_cell_line_filter = function(cell_line) {
    this.eso.query.bool.must.push({"exists": {"field": "ranks.dnase." + cell_line}});
};

Query.prototype.set_bounded_filter_generic = function(lbound, ubound, filter_idx, filter_field) {
    this.eso.post_filter.bool.must[filter_idx] = {"range":
						  {filter_field: {"gte": +lbound,
								  "lte": +ubound}
						  }
						 };
}

Query.prototype.set_gene_distance_filter = function(lbound, ubound) {
    this.set_bounded_filter_generic(lbound, ubound, NEAREST_GENE_ALL, "nearest-gene-all.distance", "gene_distance");
};

Query.prototype.set_pcgene_distance_filter = function(lbound, ubound) {
    this.set_bounded_filter_generic(lbound, ubound, NEAREST_GENE_PC, "nearest-gene-pc.distance", "pcgene_distance");
};

Query.prototype.set_dnase_rank_filter = function(lbound, ubound) {
    this.set_bounded_filter_generic(lbound, ubound, DNASE_RANK, "ranks.dnase.value", "dnase_ranks");
};

Query.prototype.set_promoter_rank_filter = function(lbound, ubound) {
    this.set_bounded_filter_generic(lbound, ubound, PROMOTER_RANK, "ranks.promoter.value", "promoter_ranks");
};

Query.prototype.set_enhancer_rank_filter = function(lbound, ubound) {
    this.set_bounded_filter_generic(lbound, ubound, ENHANCER_RANK, "ranks.enhancer.value", "enhancer_ranks");
};

Query.prototype.set_ctcf_rank_filter = function(lbound, ubound) {
    this.set_bounded_filter_generic(lbound, ubound, CTCF_RANK, "ranks.ctcf.value", "ctcf_ranks");
};

Query.prototype.set_conservation_filter = function(lbound, ubound) {
    this.set_bounded_filter_generic(lbound, ubound, CONSERVATION_RNK, "ranks.conservation", "conservation");
};

searchquery = new Query();
