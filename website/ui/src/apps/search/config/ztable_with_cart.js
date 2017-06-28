import {HelpTooltip} from '../../../common/components/help_icon'
import * as Render from '../../../common/renders'

const ZTableColumns() {

    let klassLeft = "dt-body-left dt-head-left ";
    let klassCenter = "dt-body-center dt-head-center ";

    let accHelp = "accession<br />" + HelpTooltip("CellTypeTableAccessionCol");
    let sctHelp = cts + " " + HelpTooltip("CellTypeSpecifiedClassification");

    let geneHelp = "nearest genes:<br />protein-coding / all&nbsp;&nbsp;";
    if("mm10" == GlobalAssembly){
        geneHelp += HelpTooltip("DifferentialGeneMouse");
    }

    return [
	{
	    key:'accession', title: accHelp, data: "info", className: klassCenter,
            render: Render.creTableAccession
	}, {
            key: 'k562', title: sctHelp, data: "ctspecifc", className: klassCenter,
	    render: Render.creTableCellTypeSpecific, name: "sctv", width: "12%"
	}, {
            title: "SCTsorter", data: "ctspecifc", visible: false, name: "sct",
	    render: Render.sctSorter
	}, {
	    key: 'DNaseZ', title: "DNase Z", data: "dnase_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "dnase"
	}, {
	    key: 'H3K4me3', title: "H3K4me3 Z", data: "promoter_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "promoter"
	}, {
	    key: 'H3K27ac', title: "H3K27ac Z", data: "enhancer_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "enhancer"
	}, {
	    key: 'CTCFZ', title: "CTCF Z", data: "ctcf_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "ctcf"
	}, {
	    key: 'chr', title: "chr", data: "chrom", className: klassCenter
	}, {
	    key: 'start', title: "start", data: "start", className: klassCenter,
            render: Render.integer
	}, {
	    key: 'length', title: "length", data: "len", className: klassCenter,
            render: Render.integer
	}, {
            key: 'nearestgenesproteinsodingall', title: geneHelp, data: "genesallpc",
	    className: klassCenter + "geneexp", render: Render.geneDeLinks,
            orderable: false,
	}, {
	    key: 'cart', title: "cart", data: "in_cart", className: klassCenter + "cart",
            render: (d) => Render.cart_img(d, false),
            orderable: false,
	}, {
	    key: 'genomebrowsers', title: "genome browsers", data: null,
	    className: klassCenter + "browser",
	    targets: -1,
	    orderable: false,
	    defaultContent: Render.browser_buttons(["UCSC"])
	    //, "Ensembl"
	}
    ];
}

export default ZTableColumns;


export const table_order = [];
//    [2, "desc"],
//    [3, "asc"],
//    [4, "asc"],
//    [5, "asc"]

export const columnDefs = [{ "orderData": 2, "targets": 1 }]
//                           { "orderData": 4, "targets": 3 }]

