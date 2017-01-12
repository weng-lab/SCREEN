import {RANGE_FACET, CHECKLIST_FACET, LIST_FACET, LONGLIST_FACET, LONGCHECKLIST_FACET} from '../helpers/create_facet'
import {CHECKLIST_MATCH_ALL, CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import {LongListResultsMap, LongListQueryMap, ListQueryMap, ListAggMap, ListResultsMap, RangeQueryMap, RangeAggMap, RangeResultsMap, ChecklistQueryMap, ChecklistAggMap} from '../elasticsearch/default_maps'
import {TFQueryMap} from '../elasticsearch/tf_map'
import {CoordinateQueryMap} from '../elasticsearch/coordinate_map'

import {default_margin} from './constants'
import {selected_cell_line} from '../elasticsearch/helpers'

import {render_int, render_cell_type} from './results_table'

export const render_histone_tf = (s) => (s.toUpperCase().replace(/9AC/g, "9ac").replace(/27AC/g, "27ac").replace(/ME1/g, "me1").replace(/ME2/g, "me2").replace(/ME3/g, "me3"));

const accessionsBox = {
    title: "Accessions",
    visible: (GlobalParsedQuery != "" && "accessions" in GlobalParsedQuery && GlobalParsedQuery.accessions.length != 0),
    facets: {
	"accessions": {
	    type: CHECKLIST_FACET,
	    visible: true,
	    title: "",
	    state: {
		items: (GlobalParsedQuery && "accessions" in GlobalParsedQuery ? GlobalParsedQuery.accessions.map((d) => {return {value: d, checked: true}}) : []),
		match_mode_enabled: false,
		mode: CHECKLIST_MATCH_ANY,
		autocomplete_source: []
	    }
	}
    }
};

const cellTypesBox = {
    title: "Cell Types",
    visible: true,
    facets: {
	"cell_lines": {
	    type: LONGLIST_FACET,
	    visible: true,
	    title: "",
	    state: {
		data: GlobalCellTypes,
		order: [],
		cols: [
		    {
			title: "cell type",
			data: "value",
			className: "dt-right",
			render: render_cell_type
		    },
		    {
			title: "tissue",
			data: "tissue",
			className: "dt-right"
		    }
		],
		selection: null
	    }
	}
    }
};

const chromBox = {
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
};

const coordBox = {
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
		h_interval: 200000,
		h_width: 200
	    }
	}
    }
};

const tfBox = {
    title: "Intersect TF/histone/DNase peaks",
    visible: true,
    facets: {
	"TF": {
	    type: LONGCHECKLIST_FACET,
	    visible: true,
	    title: "",
	    match_mode_enabled: true,
	    state: {
		data: (GlobalTfs.map ? GlobalTfs.map((tf) => {return {key: tf, selected: false}}) : []),
		order: [],
		cols: [{
		    title: "Assay",
		    data: "key",
		    className: "dt-right",
		    render: render_histone_tf
		}],
		mode: CHECKLIST_MATCH_ALL
	    }
	}
    }
};

const geneBox = {
    title: "Distance to Genes",
    visible: true,
    facets: {
	"genedistpc": {
	    type: RANGE_FACET,
	    visible: true,
	    title: "Protein-coding genes",
	    state: {
		range: [0, 500000000],
		selection_range: [0, 500000000],
		h_margin: default_margin,
		h_interval: 5000,
		h_width: 200
	    }
	},
	"genedistall": {
	    type: RANGE_FACET,
	    visible: true,
	    title: "All genes",
	    state: {
		range: [0, 500000000],
		selection_range: [0, 500000000],
		h_margin: default_margin,
		h_interval: 5000,
		h_width: 200
	    }
	},
    }
};

const rankBox = {
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
		h_interval: 500,
		h_width: 200
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
		h_interval: 500,
		h_width: 200
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
		h_interval: 500,
		h_width: 200
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
		h_interval: 500,
		h_width: 200
	    }
	}
    }
};

export const facetboxes = {
    "cell_lines": cellTypesBox,
    "accessions": accessionsBox,
    "chromosome": chromBox,
    "coordinates": coordBox,
    "TFs": tfBox,
    "gene_distance":  geneBox,
    "ranks": rankBox
};

export const facetbox_render_order = [
    "accessions",
    "cell_lines",
    "chromosome",
    "coordinates",
    "TFs",
    "gene_distance",
    "ranks"
];

export const es_links = {
    "accessions": {
	"accessions": {
	    f_query: [ChecklistQueryMap],
	    f_results: null,
	    field: "accession"
	}
    },
    "cell_lines": {
	"cell_lines": {
	    f_query: null,
	    f_results: [LongListResultsMap],
	    field: null,
	    st_map: (key, tfacet) => (tfacet.state.selection == null ? "" : tfacet.state.selection.replace(/_/g, " ") + " ")
	}
    },
    "chromosome": {
	"chromosome": {
	    f_query: [ListQueryMap, ListAggMap],
	    f_results: [ListResultsMap],
	    field: "position.chrom",
	    st_map: (key, tfacet) => (tfacet.state.selection == null ? "" : tfacet.state.selection + ":")
	}
    },
    "coordinates": {
	"coordinates": {
	    f_query: [CoordinateQueryMap, RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: "position.start",
	    st_map: (key, tfacet) => (tfacet.state.selection_range[0] + "-" + tfacet.state.selection_range[1])
	}
    },
    "TFs": {
	"TF": {
	    f_query: [TFQueryMap],
	    field: "tf_intersections"
	}
    },
    "gene_distance": {
	"genedistpc": {
	    f_query: [RangeQueryMap, RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: "genes.nearest-pc.distance"
	},
	"genedistall": {
	    f_query: [RangeQueryMap, RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: "genes.nearest-all.distance"
	}
    },
    "ranks": {
	"dnase": {
	    f_query: [RangeQueryMap],
	    agg_map: [RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: (state) => "ranks.dnase." + selected_cell_line(state) + ".rank"
	},
	"promoter": {
	    f_query: [RangeQueryMap],
	    agg_map: [RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: (state) => "ranks.promoter." + selected_cell_line(state) + ".DNase+H3K4me3.rank"
	},
	"enhancer": {
	    f_query: [RangeQueryMap],
	    agg_map: [RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: (state) => "ranks.enhancer." + selected_cell_line(state) + ".DNase+H3K27ac.rank"
	},
	"ctcf": {
	    f_query: [RangeQueryMap],
	    agg_map: [RangeAggMap],
	    f_results: [RangeResultsMap],
	    field: (state) => "ranks.ctcf." + selected_cell_line(state) + ".DNase+CTCF.rank"
	}
    }
};
