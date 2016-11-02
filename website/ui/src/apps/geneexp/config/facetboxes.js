import {RANGE_FACET, CHECKLIST_FACET, LIST_FACET, LONGLIST_FACET, LONGCHECKLIST_FACET} from '../helpers/create_facet'
import {CHECKLIST_MATCH_ALL, CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import {LongListResultsMap, LongListQueryMap, ListQueryMap, ListAggMap, ListResultsMap, RangeQueryMap, RangeAggMap, RangeResultsMap, ChecklistQueryMap, ChecklistAggMap} from '../elasticsearch/default_maps'
import {TFQueryMap} from '../elasticsearch/tf_map'
import {CoordinateQueryMap} from '../elasticsearch/coordinate_map'

import {default_margin} from './constants'
import {selected_cell_line} from '../elasticsearch/helpers'

import {render_int, render_cell_type} from './results_table'

export const facetboxes = {
    "cell_lines": {
	title: "Cellular Compartments",
	visible: true,
	facets: {
	    "cell_lines": {
		type: LONGCHECKLIST_FACET,
		visible: true,
		title: "",
		state: {
		    data: GlobalCellTypes,
		    order: [],
		    cols: [
			{
			    title: "compartment",
			    data: "value",
			    className: "dt-right",
			    render: render_cell_type
			}
		    ],
		    selection: null
		}
	    }
	}
    }
};

export const facetbox_render_order = [
    "cell_lines"
];
