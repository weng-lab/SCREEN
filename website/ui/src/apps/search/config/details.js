const React = require('react');
import {render_int, render_cell_type} from './results_table'
import {invalidate_detail} from '../helpers/invalidate_results'
import {SET_DETAIL_TAB} from '../reducers/root_reducer'

import {expression_heatmap_connector} from '../components/expression_heatmap'
import ExpressionHeatmapSet from '../components/expression_heatmap'

const render_factorbook_link_tf = (d) => (
    '<a href="http://beta.factorbook.org/human/chipseq/tf/' + d + '" target="_blank">' + d + '</a>');

const render_factorbook_link_histone = (d) => (
    '<a href="http://beta.factorbook.org/human/chipseq/histone/' + d + '" target="_blank">' + d + '</a>');

const render_snp_link = (d) => (
    // TODO: support mouse SNPs!
    '<a href="http://ensembl.org/Homo_sapiens/Variation/Explore?vdb=variation;v=' + d + '" target="_blank">' + d + '</a>');

const render_gene_link = (d) => (
    '<a href="http://www.genecards.org/cgi-bin/carddisp.pl?gene=' + d + '" target="_blank">' + d + '</a>');

const render_re_link = (d) => ('<a>' + d + '</a>');

export const tabs = [
    {
	title: "Top tissues",
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
		data: [],
		order: [[2, "asc"], [1, "asc"]],
		pageLength: 5,
		paging: false,
		bar_graph: true,
		bg_rank_f: (d) => (Math.log(d["H3K4me3"]))
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
		data: [],
		order: [[2, "asc"], [1, "asc"]],
		pageLength: 5,
		paging: false,
		bar_graph: true,
		bg_rank_f: (d) => (Math.log(d["H3K27ac"]))
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
		data: [],
		order: [[2, "asc"], [1, "asc"]],
		pageLength: 5,
		paging: false,
		bar_graph: true,
		bg_rank_f: (d) => (Math.log(d["ctcf"]))
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
		order: [[1, "asc"]],
		pageLength: 5,
		paging: false,
		bar_graph: true,
		bg_rank_f: (d) => (Math.log(d["rank"]))
	    }
	}
    },
    {
	title: "Nearby Genomic Features",
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
			render: render_gene_link
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
			className: "dt-right",
			render: render_re_link
		    },
		    {
			title: "distance",
			data: "distance",
			render: render_int
		    }
		],
		data: [],
		order: [[1, "asc"]],
		onTdClick: (dispatch) => (i, d) => {
		    dispatch(invalidate_detail({_source: {accession: d.name}}));
		}
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
			render: render_snp_link
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
	title: "TF and Histone Intersection",
	numCols : 2,
	tables: {
	    "tf": {
		title: "Intersecting TFs",
		cols: [
		    {
			title: "factor",
			data: "name",
			render: render_factorbook_link_tf
		    },
		    {
			title: "# experiments",
			data: "n",
			render: render_int
		    }
		],
		data: [],
		order: [[1, "desc"]]
	    },
	    "histone": {
		title: "Intersecting Histones",
		cols: [
		    {
			title: "mark",
			data: "name",
			render: render_factorbook_link_histone
		    },
		    {
			title: "# experiments",
			data: "n",
			render: render_int
		    }
		],
		data: [],
		order: [[1, "desc"]]
	    }
	}
    },
    {
	title: "Related Gene Expression",
	render: (store, key) => {
	    var ExpressionHeatmap = expression_heatmap_connector((state) => (state.re_detail.expression_matrices))(ExpressionHeatmapSet);
	    return <ExpressionHeatmap store={store} key={key} />;
	}
    }
];
