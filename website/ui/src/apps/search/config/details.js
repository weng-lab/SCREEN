const React = require('react');
import {render_int, render_cell_type} from './results_table'
import {invalidate_detail} from '../helpers/invalidate_results'
import {SET_DETAIL_TAB, main_tss_connector, main_minipeaks_connector} from '../reducers/root_reducer'

import {expression_heatmap_connector} from '../components/expression_heatmap'
import ExpressionHeatmapSet from '../components/expression_heatmap'

import TSSExpressionPlot from '../components/tss'
import MiniPeaks from '../components/minipeaks'

import {render_support, render_length, render_supporting_cts} from '../../geneexp/components/candidate_res'

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

const render_position = (pos) => (pos.chrom + ":" + pos.start + "-" + pos.end);

export const tabs = [
    {
	title: "Top tissues",
	enabled: true,
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
	title: "Candidate Target Genes",
	enabled: "mm10" != GlobalAssembly,
	numCols: 1,
	tables: {
	    "candidate_links": {
		title: "",
		paging: true,
		bInfo: true,
		bFilter: true,
		emptyText: "No target genes predicted",
		cols: [
		    {
			title: "name",
			data: "gene.common-gene-name",
			className: "dt-right",
			render: render_gene_link
		    },
		    {
			title: "ensembl ID",
			data: "gene.ensemble-id",
			className: "dt-right"
		    },
		    {
			title: "# supporting exps",
			data: "evidence",
			render: render_support
		    },
		    {
			title: "# ChIA-PET exps",
			data: "evidence.chiapet",
			render: render_length
		    },
		    {
			title: "ChIA-PET cell types",
			data: "evidence.chiapet",
			render: render_supporting_cts
		    },
		    {
			title: "# eQTL exps",
			data: "evidence.eqtls",
			render: render_length
		    },
		    {
			title: "eQTL cell types",
			data: "evidence.eqtls",
			render: render_supporting_cts
		    }
		],
		data: [],
		order: [[2, "desc"]]
	    }
	}
    },
    {
	title: "Nearby Genomic Features",
	enabled: true,
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
	    "tads": {
		title: "Genes within TAD",
		paging: true,
		bInfo: false,
		bFilter: false,
		emptyText: "No genes within TAD",
		cols: [
		    {
			title: "symbol",
			data: "approved_symbol",
			render: render_gene_link
		    },
		    {
			title: "coordinates",
			data: "coordinates"
		    }
		],
		data: [],
		order: [[0, "asc"]]
	    },
	    "re_tads": {
		title: "Other REs within TAD",
		paging: true,
		bInfo: false,
		bFilter: false,
		emptyText: "No REs within TAD",
		cols: [
		    {
			title: "accession",
			data: "accession",
			render: render_re_link
		    },
		    {
			title: "coordinates",
			data: "position",
			render:  render_position
		    }
		],
		data: [],
		order: [[0, "asc"]],
		onTdClick: (dispatch) => (i, d) => {
		    dispatch(invalidate_detail({_source: {accession: d.accession}}));
		}
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
	enabled: true,
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
	enabled: true,
	render: (store, key) => {
	    var ExpressionHeatmap = expression_heatmap_connector((state) => (state.re_detail.expression_matrices))(ExpressionHeatmapSet);
	    return <ExpressionHeatmap store={store} key={key} />;
	}
    },
    {
	title: "Associated TSS Expression",
	enabled: true,
	render: (store, key) => {
	    var TSS = main_tss_connector(TSSExpressionPlot);
	    return <TSS store={store} key={key} />;
	}
    },
    {
	title: "Similar REs",
	enabled: true,
	render: (store, key) => {
	    var Peaks = main_minipeaks_connector(MiniPeaks);
	    return <Peaks store={store} key={key} />;
	}
    }
];
