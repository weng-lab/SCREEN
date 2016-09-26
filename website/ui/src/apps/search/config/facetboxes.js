import {RANGE_FACET, CHECKLIST_FACET, LIST_FACET} from '../helpers/create_facet'
import {ListQueryMap, ListAggMap, ListResultsMap, RangeQueryMap, RangeAggMap, RangeResultsMap, ChecklistQueryMap, ChecklistAggMap} from '../elasticsearch/default_maps'
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
		    items: {
			"hg19": 1000000
		    },
		    selection: "hg19"
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
		    items: {
			"HeLa-S3": 10000,
			"GM12878": 10000,
			"HepG2": 10000
		    },
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
		    items: {
			"chr1": 10000
		    },
		    selection: null
		}
	    }
	}
    },
    "coordinates": {
	title: "Coordinates",
	visible: true,
	display_map: (state) => (state.facet_boxes.chromosome.facets.chromosome.state.selection != null),
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
		match_mode_enabled: true,
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
	    "genedistance_pc": {
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
	    "genedistance_all": {
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
	display_map: (state) => (state.facet_boxes.cell_lines.facets.cell_lines.state.selection != null),
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
	    f_query: [ListQueryMap, ListAggMap],
	    f_results: [ListResultsMap],
	    field: "genome"
	}
    },
    "cell_lines": {
    },
    "chromosome": {
	"chromosome": {
	    f_query: [ListQueryMap, ListAggMap],
	    f_results: [ListResultsMap],
	    field: "position.chrom"
	}
    },
    "coordinates": {
	"coordinates": {
	    f_query: [CoordinateQueryMap, RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: "position.start"
	}
    },
    "TFs": {
	"TF": {
	    f_query: [ChecklistQueryMap],
	    f_results: [],
	    field: "tf_intersections"
	}
    },
    "gene_distance": {
	"gene-distance.pc": {
	    f_query: [RangeQueryMap, RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: "genes.nearest-pc.distance"
	},
	"gene-distance.all": {
	    f_query: [RangeQueryMap, RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: "genes.nearest-all.distance"
	}	
    },
    "ranks": {
	"dnase": {
	    f_query: [RangeQueryMap, RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: (state) => "ranks.dnase." + selected_cell_line(state) + ".rank"
	},
	"promoter": {
	    f_query: [RangeQueryMap, RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: (state) => "ranks.promoter." + selected_cell_line(state) + ".rank"
	},
	"enhancer": {
	    f_query: [RangeQueryMap, RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: (state) => "ranks.enhancer." + selected_cell_line(state) + ".rank"
	},
	"ctcf": {
	    f_query: [RangeQueryMap, RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: (state) => "ranks.ctcf." + selected_cell_line(state) + ".rank"
	},
	"conservation": {
	    f_query: [RangeQueryMap, RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: (state) => "ranks.conservation.rank"
	}
    }
};
