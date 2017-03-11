import ReactDOMServer from 'react-dom/server'
import {HelpIconActual} from '../../../common/components/help_icon'

import * as Render from '../../../common/renders'

const TableColumns = () => {
    let klassCenter = "dt-body-center dt-head-center ";

    let ctaHelp = HelpIconActual("CellTypeAgnosticClassification");
    ctaHelp = "CTA " + ReactDOMServer.renderToStaticMarkup(ctaHelp);

    let ctsHelp = HelpIconActual("CellTypeSpecificClassification");
    ctsHelp = "CTS " + ReactDOMServer.renderToStaticMarkup(ctsHelp);

    return [
	{
	    title: "accession", data: "accession", className: klassCenter,
            render: Render.creLinkPop
	}, {
            title: ctaHelp, data: "cregroup", className: klassCenter,
	    render: Render.creGroupIcon
	}, {
            title: "", data: "cregroup", visible: false
	}, {
            title: ctsHelp, data: "cregroup", className: klassCenter,
	    render: Render.creGroupIcon
	}, {
            title: "", data: "cregroup", visible: false
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
            title: "nearest genes:<br />protein-coding / all", data: "genesallpc",
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

export const columnDefs = [{ "orderData": 2, "targets": 1 },
                           { "orderData": 4, "targets": 3 }]
