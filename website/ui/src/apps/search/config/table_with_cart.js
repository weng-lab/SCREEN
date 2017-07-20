import {ZHelpTooltip} from '../../../common/components/help_icon'
import * as ZRender from '../../../common/zrenders'

const TableColumns = (cts) => {

    let klassCenter = "text-center";

    let accHelp = (
	<span>
	    accession
	    <br />
	    {ZHelpTooltip("CellTypeTableAccessionCol")}
	</span>);
    
    let sctHelp = (
	<span>
	    {cts}
	    <br />
	    {ZHelpTooltip("CellTypeSpecifiedClassification")}
	</span>);
    
    let geneHelp = (
	<span>
	    nearest genes:
	    <br />
	    protein-coding / all&nbsp;&nbsp;
            {"mm10" == GlobalAssembly && ZHelpTooltip("DifferentialGeneMouse")}
	</span>);

    let tz = (name) => ( <span>{name}<br />Z</span>)
    
    return [
	{
	    title: accHelp, data: "info", 
            render: ZRender.creTableAccession
	}, {
            title: sctHelp, data: "ctspecifc",
	    render: ZRender.creTableCellTypeSpecificReact, name: "sctv", width: "12%"
	}, {
            title: "SCTsorter", data: "ctspecifc", visible: false, name: "sct",
	    render: ZRender.sctSorter
	}, {
	    title: tz("DNase"), data: "dnase_zscore",
	    render: ZRender.real, width: "7%", name: "dnase"
	}, {
	    title: tz("H3K4me3"), data: "promoter_zscore",
	    render: ZRender.real, width: "7%", name: "promoter"
	}, {
	    title: tz("H3K27ac"), data: "enhancer_zscore",
	    render: ZRender.real, width: "7%", name: "enhancer"
	}, {
	    title: tz("CTCF"), data: "ctcf_zscore", 
	    render: ZRender.real, width: "7%", name: "ctcf"
	}, {
	    title: "chr", data: "chrom", 
	}, {
	    title: "start", data: "start", 
            render: ZRender.numWithCommas
	}, {
	    title: "length", data: "len", 
            render: ZRender.numWithCommas
	}, {
            title: geneHelp, data: "genesallpc",
	    className: "geneexp", render: ZRender.geneDeLinks,
            orderable: false,
	}, {
	    title: "cart", data: "in_cart", className: "cart",
            render: (d) => ZRender.cart_img(d, false),
            orderable: false,
	}, {
	    title: (<span>genome<br />browsers</span>), data: null,
	    className: "browser",
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
