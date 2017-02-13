import * as Render from '../../../common/renders'

const ResultsTableColumns = [
    {
	title: "accession",
	data: "accession",
	className: "dt-right"
    },
    {
	title: "DNase Z",
	data: "dnase_zscore",
	className: "dt-right",
	render: Render.real,
	width: "7%",
	name: "dnase"
    },
    {
	title: "Promoter Z",
	data: "promoter_zscore",
	className: "dt-right",
	render: Render.real,
	width: "7%",
	name: "promoter"
    },
    {
	title: "Enhancer Z",
	data: "enhancer_zscore",
	className: "dt-right",
	render: Render.real,
	width: "7%",
	name: "enhancer"
    },
    {
	title: "CTCF Z",
	data: "ctcf_zscore",
	className: "dt-right",
	render: Render.real,
	width: "7%",
	name: "ctcf"
    },
    {
	title: "chr",
	data: "chrom",
	className: "dt-right"
    },
    {
	title: "start",
	data: "start",
	className: "dt-right",
        render: Render.integer
    },
    {
	title: "length",
	data: "len",
	className: "dt-right",
        render: Render.integer
    },
    {
	title: "nearest genes",
	data: "gene_all",
	className: "dt-right geneexp",
	render: Render.geDeButtons
    },
    {
	title: "nearest protein-coding genes",
	data: "gene_pc",
	className: "dt-right geneexp",
	render: Render.geDeButtons
    },
    {
	title: "cart",
	data: "in_cart",
	render: (d) => Render.cart_img(d, false),
	className: "cart"
    },
    {
	title: "genome browsers",
	targets: -1,
	data: null,
	className: "dt-right browser",
	orderable: false,
	defaultContent: Render.browser_buttons([
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
