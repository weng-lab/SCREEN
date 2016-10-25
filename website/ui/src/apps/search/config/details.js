import {render_int, render_cell_type} from './results_table'

const render_array = (m) => (array) => (array.length <= m ? array : [...array.slice(0, m), "..."]).join(", ");

export const tabs = [
    {
	title: "top cell types",
	numCols : 2,
	tables: {
	    "promoter": {
		title: "Promoter ranks",
		cols: [
		    {
			title: "cell type",
			data: "cell_type",
			className: "dt-right",
			render: render_cell_type
		    },
		    {
			title: "H3K4me3 and DNase",
			data: "H3K4me3_DNase",
			render: render_int
		    },
		    {
			title: "H3K4me3 only",
			data: "H3K4me3",
			render: render_int
		    }
		],
		data: []
	    },
	    "enhancer": {
		title: "Enhancer ranks",
		cols: [
		    {
			title: "cell type",
			data: "cell_type",
			className: "dt-right",
			render: render_cell_type
		    },
		    {
			title: "H3K27ac and DNase",
			data: "H3K27ac_DNase",
			render: render_int
		    },
		    {
			title: "H3K27ac only",
			data: "H3K27ac",
			render: render_int
		    }
		],
		data: []
	    },
	    "ctcf": {
		title: "CTCF ranks",
		cols: [
		    {
			title: "cell type",
			data: "cell_type",
			className: "dt-right",
			render: render_cell_type
		    },
		    {
			title: "CTCF and DNase",
			data: "ctcf_DNase",
			render: render_int
		    },
		    {
			title: "CTCF only",
			data: "ctcf",
			render: render_int
		    }
		],
		data: []
	    },
	    "dnase": {
		title: "DNase ranks",
		cols: [
		    {
			title: "cell type",
			data: "cell_type",
			className: "dt-right",
			render: render_cell_type
		    },
		    {
			title: "rank",
			data: "rank",
			render: render_int
		    }
		],
		data: [],
		order: [[1, "asc"]]
	    }
	}
    },
    {
	title: "nearby genome features",
	tables: {
	    "nearby_genes": {
		title: "Nearby genes",
		paging: false,
		bInfo: false,
		bFilter: false,
		emptyText: "No genes within 1Mb",
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
		title: "Nearby candidate REs",
		paging: false,
		bInfo: false,
		bFilter: false,
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
		title: "Nearby SNPs",
		paging: false,
		bInfo: false,
		bFilter: false,
		emptyText: "No SNPs within 10Kb",
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
	}
    },
    {
	title: "peak intersection",
	numCols : 2,
	tables: {
	    "tf": {
		title: "intersecting TFs",
		cols: [
		    {
			title: "factor",
			data: "name",
			className: "dt-right"
		    },
		    {
			title: "# experiments",
			data: "n",
			render: render_int
		    },
		    {
			title: "ENCODE accessions",
			data: "encode_accs",
			className: "dt-right",
			render: render_array(3)
		    }
		],
		data: [],
		order: [[1, "desc"]]
	    },
	    "histone": {
		title: "intersecting histones",
		cols: [
		    {
			title: "mark",
			data: "name",
			className: "dt-right"
		    },
		    {
			title: "# experiments",
			data: "n",
			render: render_int
		    },
		    {
			title: "ENCODE accessions",
			data: "encode_accs",
			className: "dt-right",
			render: render_array(3)
		    }
		],
		data: [],
		order: [[1, "desc"]]
	    }
	}
    }
];
