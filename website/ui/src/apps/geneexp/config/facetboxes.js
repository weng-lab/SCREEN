import {LONGCHECKLIST_FACET} from '../helpers/create_facet'
import {CHECKLIST_MATCH_ALL, CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'

export const facetboxes = () => {return {
    "cell_compartments": {
	title: "Cellular Compartments",
	visible: true,
	facets: {
	    "cell_compartments": {
		type: LONGCHECKLIST_FACET,
		visible: true,
		title: "",
		match_mode_enabled: false,
		state: {
		    data: GlobalCellCompartments,
		    order: [],
		    cols: [
			{
			    title: "compartment",
			    data: "value",
			    className: "dt-right"
			}
		    ],
		    selection: null,
		    mode: CHECKLIST_MATCH_ANY
		}
	    }
	}
    }
}};

export const facetbox_render_order = [
    "cell_compartments"
];
