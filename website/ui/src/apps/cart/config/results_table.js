import {render_int, render_float, render_gene, render_cell_type, browser_buttons} from '../../search/config/results_table'

const ResultsTableColumns = [
    {
	title: "accession",
	data: "_source.accession",
	className: "dt-right"
    },
    {
	title: "&#8209;log(p)",
	data: "_source.neg-log-p",
	className: "dt-right",
        render: render_float
    },
    {
	title: "chr",
	data: "_source.position.chrom",
	className: "dt-right"
    },
    {
	title: "start",
	data: "_source.position.start",
	className: "dt-right",
        render: render_int
    },
    {
	title: "end",
	data: "_source.position.end",
	className: "dt-right",
        render: render_int
    },
    {
	title: "nearest gene",
	data: "_source.genes.nearest-all",
	className: "dt-right",
	render: render_gene
    },
    {
	title: "nearest protein-coding gene",
	data: "_source.genes.nearest-pc",
	className: "dt-right",
	render: render_gene
    },
    {
	title: "genome browsers",
	targets: -1,
	data: null,
	className: "dt-right browser",
	orderable: false,
        defaultContent: browser_buttons([
	    "UCSC",
	    "WashU",
	    "Ensembl"
	])
    }
];    
export default ResultsTableColumns;

export const table_order = [
    [1, "desc"],
    [2, "asc"],
    [3, "asc"],
    [4, "asc"]
];
