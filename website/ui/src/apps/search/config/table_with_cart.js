import * as Render from '../../../common/renders'

const TableColumns = () => {
    let klassLeft = "dt-right dt-head-center ";
    let klassCenter = "dt-body-center dt-head-center ";
    return [
	{
	    title: "accession", data: "accession", className: klassCenter
	}, {
            title: "cre_group", data: "cre_group", visible: false
	}, {
	    title: "DNase Z", data: "dnase_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "dnase"
	}, {
	    title: "H3K4me3 Z", data: "promoter_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "promoter"
	}, {
	    title: "H3K27ac Z", data: "enhancer_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "enhancer"
	}, {
	    title: "CTCF-bound Z", data: "ctcf_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "ctcf"
	}, {
	    title: "chr", data: "chrom", className: klassCenter
	}, {
	    title: "start", data: "start", className: klassCenter,
            render: Render.integer
	}, {
	    title: "length", data: "len", className: klassCenter,
            render: Render.integer
	}, {
            title: "nearest genes:<br />protein-coding / all", data: "genesallpc",
	    className: klassCenter + "geneexp", render: Render.geneDeLinks
	}, {
	    title: "cart", data: "in_cart", className: klassCenter + "cart",
            render: (d) => Render.cart_img(d, false),
	}, {
	    title: "genome browsers", data: null,
	    className: klassCenter + "browser",
	    targets: -1, orderable: false,
	    defaultContent: Render.browser_buttons(["UCSC", "WashU"])
	    //, "Ensembl"
	}
    ];
}

export default TableColumns;

export const table_order = [
    [2, "desc"],
    [3, "asc"],
    [4, "asc"],
    [5, "asc"]
];
