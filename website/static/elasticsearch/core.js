var POSITION_CHROM   = 0;
var POSITION_START   = 1;
var POSITION_END     = 2;
var NEAREST_GENE_ALL = 3;
var NEAREST_GENE_PC  = 4;
var DNASE_RANKS      = 5;
var PROMOTER_RANKS   = 6;
var ENHANCER_RANKS   = 7;
var CTCF_RANKS       = 8;

var HISTOGRAM_BINS   = 50;

var searchquery = {

    "eso": {
	"aggs": {
	    "chrom": {"terms": {"field": "position.chrom"}},
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
					 "interval": 500}}
	},
	"query": {
	    "bool": {
		"must": [
		    {}, // position.chrom
		    {}, // position.start
		    {}, // position.end
		    {}, // nearest-gene-all.distance
		    {}, // nearest-gene-pc.distance
		    {}, // dnase ranks
		    {}, // promoter ranks
		    {}, // enhancer ranks
		    {} // ctcf ranks
		]
	    }
	}
    }

    set_coordinate_filter: function(chrom, start, end) {
	this.eso.query.bool.must[POISITION_CHROM] = {"match" : { "position.chrom" : chrom } };
	this.eso.query.bool.must[POSITION_START]  = {"range" : { "position.start" : { "lte" : +end } } };
	this.eso.query.bool.must[POSITION_END]    = {"range" : { "position.end" : { "gte" : +start } } };
	delete this.eso.aggs.chrom;
	this.eso.aggs.start.histogram.interval = (end - start) / HISTOGRAM_BINS;
	this.eso.aggs.end.histogram.interval = this.eso.aggs.start.histogram.interval;
    },

    add_cell_line_filter: function(cell_line) {
	this.eso.query.bool.must.push({"match": {"ranks.dnase.name", cell_line}});
	delete this.eso.aggs.cell_lines;
    },

    set_bounded_filter_generic: function(lbound, ubound, filter_idx, filter_field, agg_name) {
	this.eso.query.bool.must[filter_idx] = {"range":
					        {filter_field:
					         {"gte": +lbound},
					         {"lte": +ubound}
					        }
					       };
	this.eso.aggs[agg_name].histogram.interval = (ubound / lbound) / HISTOGRAM_BINS;
    },

    set_gene_distance_filter: function(lbound, ubound) {
	this.set_bounded_filter_generic(lbound, ubound, NEAREST_GENE_ALL, "nearest-gene-all.distance", "gene_distance");
    },

    set_pcgene_distance_filter: function(lbound, ubound) {
	this.set_bounded_filter_generic(lbound, ubound, NEAREST_GENE_PC, "nearest-gene-pc.distance", "pcgene_distance");
    },

    set_dnase_rank_filter: function(lbound, ubound) {
	this.set_bounded_filter_generic(lbound, ubound, DNASE_RANK, "ranks.dnase.value", "dnase_ranks");
    },

    set_promoter_rank_filter: function(lbound, ubound) {
	this.set_bounded_filter_generic(lbound, ubound, PROMOTER_RANK, "ranks.promoter.value", "promoter_ranks");
    },

    set_enhancer_rank_filter: function(lbound, ubound) {
	this.set_bounded_filter_generic(lbound, ubound, ENHANCER_RANK, "ranks.enhancer.value", "enhancer_ranks");
    },

    set_ctcf_rank_filter: function(lbound, ubound) {
	this.set_bounded_filter_generic(lbound, ubound, CTCF_RANK, "ranks.ctcf.value", "ctcf_ranks");
    }

};
