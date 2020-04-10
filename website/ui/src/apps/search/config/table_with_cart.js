/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';
import {ZHelpTooltip} from '../../../common/components/help_icon'
import * as ZRender from '../../../common/zrenders'

const vistalinks = x => {
    if (x === null) { return '--'; }
    let xx = x.split(',');
    return (
	<div>VISTA: {xx.map( (v, i) => <span>{vistalink(v)}{i < xx.length - 1 ? ", " : ""}</span>)}</div>
    );
};

const vistalink = id => (
    <a href={'https://enhancer.lbl.gov/cgi-bin/imagedb3.pl?form=presentation&show=1&experiment_id=' + id.substring(2) + '&organism_id=' + (id[0] === 'm' ? '2' : '1')}
      target="_blank">{id}</a>
);

const TableColumns = ({globals, assembly, rfacets, uuid}, cts) => {
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

    const tz = (name, cts) => cts ? (<span>{name} Z in<br />{cts}</span>) : (<span>{name}<br />max-Z</span>);
    
    return [
	{
	    title: accHelp, data: "info", sortDataF: (d) => (ZRender.accSorter(d)),
            render: ZRender.creTableAccession(globals)
	}, {
            title: sctHelp, data: "ctspecifc", visible: cts,
	    sortDataF: (d) => (ZRender.sctSorter(d)),
	    render: ZRender.creTableCellTypeSpecific(globals), name: "sctv", width: "12%"
	}, {
	    title: tz("DNase", cts), data: "dnase_zscore", visible: rfacets.includes("dnase"),
	    render: ZRender.real, name: "dnase", width: "7%"
	}, {
	    title: tz("H3K4me3", cts), data: "promoter_zscore", visible: rfacets.includes("promoter"),
	    render: ZRender.real, name: "promoter", width: "7%"
	}, {
	    title: tz("H3K27ac", cts), data: "enhancer_zscore", visible: rfacets.includes("enhancer"),
	    render: ZRender.real, name: "enhancer", width: "7%"
	}, {
	    title: tz("CTCF", cts), data: "ctcf_zscore", visible: rfacets.includes("ctcf"),
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
	    title: <span>experimental<br/>evidence</span>, data: "vistaids",
	    render: vistalinks, className: "experimental", visible: false
	}, {
            title: geneHelp, data: "genesallpc",
	    className: "geneexp", render: ZRender.geneDeLinks(assembly, uuid),
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

export const table_order = ["dnase_zscore", false];
