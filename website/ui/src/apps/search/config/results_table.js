import * as Render from '../../../common/renders'

const ResultsTableColumns = () => ([
    {
	title: "accession", data: "accession", className: "dt-right"
    }, {
        title: "cre_group", data: "cre_group", visible: false
    }, {
	title: "DNase Z", data: "dnase_zscore", className: "dt-right",
	render: Render.real, width: "7%", name: "dnase"
    }, {
	title: "H3K4me3 Z", data: "promoter_zscore", className: "dt-right",
	render: Render.real, width: "7%", name: "promoter"
    }, {
	title: "H3K27ac Z", data: "enhancer_zscore", className: "dt-right",
	render: Render.real, width: "7%", name: "enhancer"
    }, {
	title: "CTCF-bound Z", data: "ctcf_zscore", className: "dt-right",
	render: Render.real, width: "7%", name: "ctcf"
    }, {
	title: "chr", data: "chrom", className: "dt-right"
    }, {
	title: "start", data: "start", className: "dt-right",
        render: Render.integer
    }, {
	title: "length", data: "len", className: "dt-right",
        render: Render.integer
    }, {
	title: "nearest genes", data: "gene_all", className: "dt-right geneexp",
	render: Render.geDeButtons
    }, {
        title: "nearest protein-coding genes", data: "gene_pc",
	className: "dt-right geneexp", render: Render.geDeButtons
    }, {
	title: "cart", data: "in_cart", className: "cart",
        render: (d) => Render.cart_img(d, false),
    }, {
	title: "genome browsers", data: null, className: "dt-right browser",
	targets: -1,
	orderable: false,
	defaultContent: Render.browser_buttons(["UCSC", "WashU", "Ensembl" ])
    }
]);

export default ResultsTableColumns;

export const table_order = [
    [2, "desc"],
    [3, "asc"],
    [4, "asc"],
    [5, "asc"]
];
