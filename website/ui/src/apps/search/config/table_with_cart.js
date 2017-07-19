import {ZHelpTooltip} from '../../../common/components/help_icon'
import * as ZRender from '../../../common/zrenders'

const TableColumns = (cts) => {

    let klassLeft = "dt-body-left dt-head-left ";
    let klassCenter = "dt-body-center dt-head-center ";

    let accHelp = (
	<span>
	    accession
	    <br />
	    {ZHelpTooltip("CellTypeTableAccessionCol")}
	</span>);
    
    let sctHelp = (
	<span>
	{cts}
	{ZHelpTooltip("CellTypeSpecifiedClassification")}
	</span>);
    
    let geneHelp = (
	<span>
	nearest genes:
	<br />
	protein-coding / all&nbsp;&nbsp;
        {"mm10" == GlobalAssembly && ZHelpTooltip("DifferentialGeneMouse")}
	</span>);

    return [
	{
	    title: accHelp, data: "info", className: klassCenter,
            render: ZRender.creTableAccession
	}, {
            title: sctHelp, data: "ctspecifc", className: klassCenter,
	    render: ZRender.creTableCellTypeSpecificReact, name: "sctv", width: "12%"
	}, {
            title: "SCTsorter", data: "ctspecifc", visible: false, name: "sct",
	    render: ZRender.sctSorter
	}, {
	    title: "DNase Z", data: "dnase_zscore", className: klassCenter,
	    render: ZRender.real, width: "7%", name: "dnase"
	}, {
	    title: "H3K4me3 Z", data: "promoter_zscore", className: klassCenter,
	    render: ZRender.real, width: "7%", name: "promoter"
	}, {
	    title: "H3K27ac Z", data: "enhancer_zscore", className: klassCenter,
	    render: ZRender.real, width: "7%", name: "enhancer"
	}, {
	    title: "CTCF Z", data: "ctcf_zscore", className: klassCenter,
	    render: ZRender.real, width: "7%", name: "ctcf"
	}, {
	    title: "chr", data: "chrom", className: klassCenter
	}, {
	    title: "start", data: "start", className: klassCenter,
            render: ZRender.numWithCommas
	}, {
	    title: "length", data: "len", className: klassCenter,
            render: ZRender.numWithCommas
	}, {
            title: geneHelp, data: "genesallpc",
	    className: klassCenter + "geneexp", render: ZRender.geneDeLinks,
            orderable: false,
	}, {
	    title: "cart", data: "in_cart", className: klassCenter + "cart",
            render: (d) => ZRender.cart_img(d, false),
            orderable: false,
	}, {
	    title: "genome browsers", data: null,
	    className: klassCenter + "browser",
	    targets: -1,
	    orderable: false,
	    defaultContent: ZRender.browser_buttons(["UCSC"])
	    //, "Ensembl"
	}
    ];
}

export default TableColumns;

export const table_order = [];
//    [2, "desc"],
//    [3, "asc"],
//    [4, "asc"],
//    [5, "asc"]

export const columnDefs = [{ "orderData": 2, "targets": 1 }]
//                           { "orderData": 4, "targets": 3 }]
