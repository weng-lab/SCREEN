import {RANGE_FACET, CHECKLIST_FACET, LIST_FACET} from '../helpers/create_facet'
import {ListQueryMap, ListAggMap, RangeQueryMap, RangeAggMap} from '../elasticsearch/default_maps'
import {CoordinateQueryMap} from '../elasticsearch/coordinate_map'

import {default_margin} from './constants'
import {selected_cell_line} from '../elasticsearch/helpers'

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
    "cell_lines": {
	title: "Cell Types",
	visible: true,
	facets: {
	    "cell_lines": {
		type: LIST_FACET,
		visible: true,
		title: "",
		state: {
		    items: [
			{value: "HeLa-S3", n: 10000},
			{value: "GM12878", n: 10000},
			{value: "HepG2", n: 10000}
		    ],
		    selection: null
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
    "coordinates": {
	title: "Coordinates",
	visible: true,
	facets: {
	    "coordinates": {
		type: RANGE_FACET,
		visible: true,
		title: "",
		state: {
		    range: [0, 200000000],
		    selection_range: [0, 200000000],
		    h_margin: default_margin,
		    h_interval: 200000
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
		    h_margin: default_margin,
		    h_interval: 5000
		}
	    },
	    "gene-distance.all": {
		type: RANGE_FACET,
		visible: true,
		title: "All",
		state: {
		    range: [0, 20000],
		    selection_range: [0, 20000],
		    h_margin: default_margin,
		    h_interval: 5000
		}
	    },
	}
    },
    "ranks": {
	title: "Rank",
	visible: true,
	facets: {
	    "dnase": {
		type: RANGE_FACET,
		visible: true,
		title: "DNase",
		state: {
		    range: [0, 20000],
		    selection_range: [0, 20000],
		    h_margin: default_margin,
		    h_interval: 500
		}
	    },
	    "promoter": {
		type: RANGE_FACET,
		visible: true,
		title: "promoter",
		state: {
		    range: [0, 20000],
		    selection_range: [0, 20000],
		    h_margin: default_margin,
		    h_interval: 500
		}
	    },
	    "enhancer": {
		type: RANGE_FACET,
		visible: true,
		title: "enhancer",
		state: {
		    range: [0, 20000],
		    selection_range: [0, 20000],
		    h_margin: default_margin,
		    h_interval: 500
		}
	    },
	    "ctcf": {
		type: RANGE_FACET,
		visible: true,
		title: "CTCF",
		state: {
		    range: [0, 20000],
		    selection_range: [0, 20000],
		    h_margin: default_margin,
		    h_interval: 500
		}
	    },
	    "conservation": {
		type: RANGE_FACET,
		visible: true,
		title: "conservation",
		state: {
		    range: [0, 20000],
		    selection_range: [0, 20000],
		    h_margin: default_margin,
		    h_interval: 500
		}
	    }
	}
    }
};

export const facetbox_render_order = [
    "assembly",
    "cell_lines",
    "chromosome",
    "coordinates",
    "TFs",
    "gene_distance",
    "ranks"
];

export const es_links = {
    "assembly": {
	"assembly": {
	    f: [ListQueryMap, ListAggMap],
	    field: "genome"
	}
    },
    "cell_lines": {
    },
    "chromosome": {
	"chromosome": {
	    f: [ListQueryMap, ListAggMap],
	    field: "position.chrom"
	}
    },
    "coordinates": {
	"coordinates": {
	    f: [CoordinateQueryMap, RangeAggMap],
	    field: "position.start"
	}
    },
    "TFs": {
    },
    "gene_distance": {
	"gene-distance.pc": {
	    f: [RangeQueryMap, RangeAggMap],
	    field: "genes.nearest-pc.distance"
	},
	"gene-distance.all": {
	    f: [RangeQueryMap, RangeAggMap],
	    field: "gene.nearest-all.distance"
	}	
    },
    "ranks": {
	"dnase": {
	    f: [RangeQueryMap, RangeAggMap],
	    field: (state) => "ranks.dnase." + selected_cell_line(state) + ".rank"
	},
	"promoter": {
	    f: [RangeQueryMap, RangeAggMap],
	    field: (state) => "ranks.promoter." + selected_cell_line(state) + ".rank"
	},
	"enhancer": {
	    f: [RangeQueryMap, RangeAggMap],
	    field: (state) => "ranks.enhancer." + selected_cell_line(state) + ".rank"
	},
	"ctcf": {
	    f: [RangeQueryMap, RangeAggMap],
	    field: (state) => "ranks.ctcf." + selected_cell_line(state) + ".rank"
	},
	"conservation": {
	    f: [RangeQueryMap, RangeAggMap],
	    field: (state) => "ranks.conservation.rank"
	}
    }
};
