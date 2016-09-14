import {RANGE_FACET, CHECKLIST_FACET, LIST_FACET} from '../helpers/create_facet'
import {ListQueryMap, RangeQueryMap, RangeAggMap} from '../helpers/es_connect'

export const facetboxes = {
    "assembly": {
	title: "Assembly",
	visible: true,
	facets: {
	    "assembly": {
		type: LIST_FACET,
		visible: true,
		title: "",
		state: {
		    items: [{
			value: "hg19",
			n: 1000000
		    }],
		    selection: 0
		}
	    }
	}
    },
    "chromosome": {
	title: "Chromosome",
	visible: true,
	facets: {
	    "chromosome": {
		type: LIST_FACET,
		visible: true,
		title: "",
		state: {
		    items: [
			{value: "chr1", n: 10000},
			{value: "chr2", n: 10000},
			{value: "chr3", n: 10000},
			{value: "chrX", n: 10000},
			{value: "chrY", n: 10000}
		    ],
		    selection: null
		}
	    }
	}
    },
    "TFs": {
	title: "TF intersection",
	visible: true,
	facets: {
	    "TF": {
		type: CHECKLIST_FACET,
		visible: true,
		title: "",
		state: {
		    items: []
		}
	    }
	}
    },
    "gene_distance": {
	title: "Distance to Genes",
	visible: true,
	facets: {
	    "gene-distance.pc": {
		type: RANGE_FACET,
		visible: true,
		title: "Protein coding",
		state: {
		    range: [0, 20000],
		    selection_range: [0, 20000],
		    h_margin: {top: 1, bottom: 1, left: 1, right: 1},
		    h_interval: 10
		}
	    },
	    "gene-distance.all": {
		type: RANGE_FACET,
		visible: true,
		title: "All",
		state: {
		    range: [0, 20000],
		    selection_range: [0, 20000],
		    h_margin: {top: 1, bottom: 1, left: 1, right: 1},
		    h_interval: 10
		}
	    },
	}
    }
};

export const facetbox_render_order = [
    "assembly",
    "chromosome",
    "TFs",
    "gene_distance"
];

export const es_links = {
    "assembly": {
	"assembly": {
	    f: [ListQueryMap],
	    field: "assembly"
	}
    },
    "chromosome": {
	"chromosome": {
	    f: [ListQueryMap],
	    field: "position.chrom"
	}
    },
    "TFs": {
    },
    "gene_distance": {
	"gene-distance.pc": {
	    f: [RangeQueryMap, RangeAggMap],
	    field: "gene-distance.pc"
	},
	"gene-distance.all": {
	    f: [RangeQueryMap, RangeAggMap],
	    field: "gene-distance.all"
	}	
    }
};
