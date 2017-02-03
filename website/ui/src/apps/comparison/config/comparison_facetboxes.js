import {SLIDER_FACET, RANGE_FACET, LIST_FACET, LONGCHECKLIST_FACET} from '../../search/helpers/create_facet'
import {CHECKLIST_MATCH_ALL, CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import {ListQueryMap, ListAggMap, ListResultsMap, RangeQueryMap, RangeAggMap, RangeResultsMap} from '../../search/elasticsearch/default_maps'
import {CoordinateQueryMap} from '../../search/elasticsearch/coordinate_map'
import {CellTypeQueryMap, RankTypeQueryMap, RankThresholdQueryMap, RankThresholdResultsMap} from '../../search/elasticsearch/comparison_maps'

import {default_margin} from '../../search/config/constants'
import {selected_cell_line} from '../../search/elasticsearch/helpers'

import {render_int, render_cell_type} from '../../search/config/results_table'

export const count_selected_cell_lines = (data) => {
    var i = 0;
    data.map((d) => {if (d.selected) ++i;});
    return i;
};

export const facetboxes = {
    "cell_lines": {
	title: "Cell Types",
	visible: true,
	facets: {
	    "cell_lines": {
		type: LONGCHECKLIST_FACET,
		visible: true,
		title: "",
		state: {
		    data: "(Globals.cellTypeInfo ? Globals.cellTypeInfo.map((ct) => {return {key: ct.name, tissue: ct.tissue, selected: false}}) : [])",
		    order: [],
		    cols: [
			{
			    title: "cell type",
			    data: "key",
			    className: "dt-right",
			    render: render_cell_type
			},
			{
			    title: "tissue",
			    data: "tissue",
			    className: "dt-right"
			}
		    ],
		    mode: CHECKLIST_MATCH_ALL
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
		    h_interval: 200000,
		    h_width: 200
		}
	    }
	}
    },
    "rank": {
	title: "Rank threshold",
	visible: true,
	display_map: (state) => (count_selected_cell_lines(state.facet_boxes.cell_lines.facets.cell_lines.state.data) >= 2),
	facets: {
	    "type": {
		type: LIST_FACET,
		visible: true,
		title: "",
		state: {
		    items: {
			"DNase": "",
			"Enhancer": "",
			"Promoter": "",
			"CTCF": ""
		    },
		    selection: "DNase"
		}
	    },
	    "threshold": {
		type: SLIDER_FACET,
		display_map: (state) => (state.facet_boxes.rank.facets.type.selection != null),
		visible: true,
		title: "",
		state: {
		    range: [0, 100000],
		    value: 20000
		}
	    }
	}
    }
};

const _rank = {
    "DNase": "dnase",
    "Enhancer": "enhancer",
    "Promoter": "promoter",
    "CTCF": "ctcf"
};

const _rank_subfield = {
    "DNase": "",
    "Enhancer": ".H3K27ac-Only",
    "Promoter": ".H3K4me3-Only",
    "CTCF": ".CTCF-Only"
};

export const rank_field = (state) => {
    var rank_type = state.facet_boxes.rank.facets.type.state.selection;
    return "ranks." + _rank[rank_type] + ".%s" + _rank_subfield[rank_type] + ".rank";
};

export const facetbox_render_order = [
    "cell_lines",
    "rank",
    "chromosome",
    "coordinates"
];

export const es_links = {
    "cell_lines": {
	"cell_lines": {
	    f_query: [CellTypeQueryMap],
	    field: null
	}
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
    "rank": {
	"threshold": {
	    f_query: [RankThresholdQueryMap],
	    f_results: [RankThresholdResultsMap],
	    field: rank_field
	},
	"type": {
	    f_query: [RankTypeQueryMap],
	    f_results: null,
	    field: null
	}
    }
};
