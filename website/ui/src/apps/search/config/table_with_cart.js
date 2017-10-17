import React from 'react';
import {ZHelpTooltip} from '../../../common/components/help_icon'
import * as ZRender from '../../../common/zrenders'

const TableColumns = (globals, assembly, cts, rfacets) => {
    let accHelp = (
	<span>
	    accession
	    <br />
	    {ZHelpTooltip(globals, "CellTypeTableAccessionCol")}
	</span>);

    let sctHelp = (
	<span>
	    {cts}
	    <br />
	    {ZHelpTooltip(globals, "CellTypeSpecifiedClassification")}
	</span>);

    let geneHelp = (
	<span>
	    nearest genes:
	    <br />
	    protein-coding / all&nbsp;&nbsp;
            {"mm10" === assembly && ZHelpTooltip(globals, "DifferentialGeneMouse")}
	</span>);

    const tz = (name) => (<span>{name}<br />Z</span>)
    
    return [
      { title: "", data: "checked", className: "selectcre",
	      render: ZRender.checkRd},
	{
	    title: accHelp, data: "info",
            render: ZRender.creTableAccession(globals)
	}, {
            title: sctHelp, data: "ctspecifc", visible: cts,
	    render: ZRender.creTableCellTypeSpecific(globals), name: "sctv", width: "12%"
	}, {
	    title: tz("DNase"), data: "dnase_zscore", visible: rfacets.includes("dnase"),
	    render: ZRender.real, name: "dnase", width: "7%"
	}, {
	    title: tz("H3K4me3"), data: "promoter_zscore", visible: rfacets.includes("promoter"),
	    render: ZRender.real, name: "promoter", width: "7%"
	}, {
	    title: tz("H3K27ac"), data: "enhancer_zscore", visible: rfacets.includes("enhancer"),
	    render: ZRender.real, name: "enhancer", width: "7%"
	}, {
	    title: tz("CTCF"), data: "ctcf_zscore", visible: rfacets.includes("ctcf"),
	    render: ZRender.real, name: "ctcf", width: "7%"
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
	    className: "geneexp", render: ZRender.geneDeLinks(assembly),
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
