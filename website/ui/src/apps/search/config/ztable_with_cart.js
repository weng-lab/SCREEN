import {HelpTooltip} from '../../../common/components/help_icon'
import * as Render from '../../../common/renders'

import renderHTML from 'react-render-html'


const TableColumns = (cts) => {

    let klassLeft = "dt-body-left dt-head-left ";
    let klassCenter = "dt-body-center dt-head-center ";


    let accHelp = <div> accession<br/> {renderHTML(HelpTooltip("CellTypeTableAccessionCol"))} </div>;

    let sctHelp = <p>{cts} {renderHTML(HelpTooltip("CellTypeSpecifiedClassification"))}</p>;

    let geneHelp = <p>nearest genes:<br/>protein-coding / all&nbsp;&nbsp; </p>
    if("mm10" == GlobalAssembly){
        geneHelp += HelpTooltip("DifferentialGeneMouse");
    }




    return [
	{
	    title: accHelp, data: "info", className: klassCenter,
            render: Render.creTableAccession
	}, {
            title: sctHelp, data: "ctspecifc", className: klassCenter,
	    render: Render.creTableCellTypeSpecific, name: "sctv", width: "12%"
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
	    title: "CTCF Z", data: "ctcf_zscore", className: klassCenter,
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
            title: geneHelp, data: "genesallpc",
	    className: klassCenter + "geneexp", render: Render.geneDeLinks,
            orderable: false,
	}, {
	    title: "cart", data: "in_cart", className: klassCenter + "cart",
            render: (d) => Render.cart_img(d, false),
            orderable: false,
	}, {
	    title: "genome browsers", data: null,
	    className: klassCenter + "browser",
	    targets: -1,
	    orderable: false,
	    defaultContent: Render.browser_buttons(["UCSC"])
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
