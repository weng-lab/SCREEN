import {render_int} from './results_table'

export const tables = {
    "nearby_genes": {
	title: "nearby genes",
	cols: [
	    {
		title: "symbol",
		data: "name",
		className: "dt-right"
	    },
	    {
		title: "distance",
		data: "distance",
		render: render_int
	    }
	],
	data: [],
	order: [[1, "asc"]]
    },
    "nearby_res": {
	title: "nearby candidate REs",
	cols: [
	    {
		title: "accession",
		data: "name",
		className: "dt-right"
	    },
	    {
		title: "distance",
		data: "distance",
		render: render_int
	    }
	],
	data: [],
	order: [[1, "asc"]]
    },
    "overlapping_snps": {
	title: "overlapping SNPs",
	cols: [
	    {
		title: "accession",
		data: "name",
		className: "dt-right"
	    },
	    {
		title: "distance",
		data: "distance",
		render: render_int
	    }
	],
	data: [],
	order: [[1, "asc"]]
    }
};
