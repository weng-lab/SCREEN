import React from 'react';
import {connect} from 'react-redux';

import Ztable from '../../../common/components/ztable/ztable';

import TableColumns, {table_order, columnDefs} from '../config/table_with_cart';
import {numberWithCommas} from '../../../common/common';
import {getCommonState} from '../../../common/utility';
import loading from '../../../common/components/loading'

import * as Render from '../../../common/renders'
import {doToggle, isCart} from '../../../common/utility'

class TableWithCart extends React.Component {
    constructor(props) {
	super(props);
        this.table_click_handler = this.table_click_handler.bind(this);
    }

    table_click_handler(td, rowdata, actions){
        if (td.indexOf("browser") != -1) {
	    let cre = {...rowdata, ...rowdata.info};
	    actions.showGenomeBrowser(cre, name);
	    return;
	}
        if (td.indexOf("geneexp") != -1) {
	    return;
	}
        if (td.indexOf("cart") != -1) {
	    //console.log(rowdata.info);
            let accession = rowdata.info.accession;
            let accessions = doToggle(this.props.cart_accessions, accession);
	    let j = {GlobalAssembly, accessions};
	    $.ajax({
		type: "POST",
		url: "/cart/set",
		data: JSON.stringify(j),
		dataType: "json",
		contentType: "application/json",
		success: (response) => {
                }
	    });
	    actions.setCart(accessions);
	    return;
        }
	let cre = {...rowdata, ...rowdata.info};
        actions.showReDetail(cre);
    }

    addAllToCart() {
	let accessions = this.props.data.map((d) => {
	    //console.log("addAllToCart:", d);
	    return d.info.accession;
	})
        accessions = new Set([...this.props.cart_accessions,
                              ...accessions]);
	let j = {GlobalAssembly, accessions};
	$.ajax({
	    type: "POST",
	    url: "/cart/set",
	    data: JSON.stringify(j),
	    dataType: "json",
	    contentType: "application/json",
	    success: (response) => {
		let href = window.location.href;
		if(href.includes("&cart")){
		    return;
		}
		// go to cart page
		window.open(href + "&cart", '_blank');
	    }
	});
	this.props.actions.setCart(accessions);
    }

    clearCart() {
	let accessions = new Set([]);
	let j = {GlobalAssembly, accessions}
	$.ajax({
	    type: "POST",
	    url: "/cart/set",
	    data: JSON.stringify(j),
	    dataType: "json",
	    contentType: "application/json",
	    success: (response) => {
		let href = window.location.href;
		if(href.includes("&cart")){
		    // go back to search page
		    href = href.replace("&cart", "");
		    window.location.href = href;
		}
	    }
	});
        this.props.actions.setCart(accessions);
    }

    downloadBed() {
	var jq = this.props.jq;

	$.ajax({
            type: "POST",
            url: "/dataws/bed_download",
            data: jq,
            dataType: "json",
            contentType : "application/json",
            async: false, // http://stackoverflow.com/a/20235765
            success: function(got){
		if("error" in got){
		    console.log(got["error"]);
                    $("#errMsg").text(got["err"]);
                    $("#errBox").show()
                    return true;
		}

		return window.open(got["url"], '_blank');
            }
	});
    }

    downloadJSON() {
	var jq = this.props.jq;

	$.ajax({
            type: "POST",
            url: "/dataws/json_download",
            data: jq,
            dataType: "json",
            contentType : "application/json",
            async: false, // http://stackoverflow.com/a/20235765
            success: function(got){
		if("error" in got){
		    console.log(got["error"]);
                    $("#errMsg").text(got["err"]);
                    $("#errBox").show()
                    return true;
		}

		return window.open(got["url"], '_blank');
            }
	});
    }

    totalText(data){
        if(data.length < this.props.total){
		return "displaying top " + numberWithCommas(data.length) +
                " results of " + numberWithCommas(this.props.total) + " total";
        }
        return "found " + this.props.total + " results";
    }

    tableFooter(data){
	var total = this.totalText(data);
	var addTitle = "Add all to cart";
	if(this.props.data.length >= 1000){
	    addTitle = "Add 1,000 to cart";
	}
        return (
            <div style={{display: (this.props.isFetching ? "none" : "block")}}>
                <span className="tableInfo">

                    <div className={"btn-group"} role={"group"}>
		        <button type={"button"}
                                className={"btn btn-default btn-xs"}
                                onClick={() => {
                                        this.addAllToCart()}}>
                            {addTitle}
                        </button>
		        <button type={"button"}
                                className={"btn btn-default btn-xs"}
                                onClick={() => {
                                        this.clearCart()}}>
                            {"Clear cart"}
                        </button>
		        <button type={"button"}
                                className={"btn btn-default btn-xs"}
                                onClick={() => {
                                        this.downloadBed()}}>
                            Download bed
                        </button>
		        <button type={"button"}
                                className={"btn btn-default btn-xs"}
                                onClick={() => {
                                        this.downloadJSON()}}>
                            Download JSON
                        </button>
		    </div>&nbsp;&nbsp;{total}
		</span>
            </div>);
    }

    _format_message(a) {
	if (a.length == 0) {
            return a;
        }
	let r = "";
	for (let i = 0; i < a.length - 1; ++i) {
	    r += a[i] + ", ";
	}
	r += "or " + a[a.length - 1];
	return r;
    }

    _oppositeAssays(a){
	let r = {"dnase" : true, "promoter": true,
                 "enhancer": true, "ctcf": true};
	let map = {"DNase-seq": "dnase", "H3K4me3 ChIP-seq": "promoter",
                   "H3K27ac ChIP-seq": "enhancer", "CTCF ChIP-seq": "ctcf"};
	if (!a) {
            return r;
        }
	for (let i in a) {
	    r[map[a[i]]] = false
	}
	return r;
    }

    _opposite(a, cts) {
        let r = this._oppositeAssays(a);
        r["cts"] = false;
        r["sctv"] = false;
        if(cts){
            for (let e of cts) {
	        r[e] = true;
            }
        }
        return r;
    }

    colorCreGroup(row, data, index){
	// add via createdRow={this.colorCreGroup}
        // https://datatables.net/examples/advanced_init/row_callback.html
        let lookup = {1 : "creCtcfLike",
                      2 : "creEnhancerLike",
                      3 : "crePromoterLike"};
        let lookupTitle = {1 : "CTCF-bound",
                           2 : "Enhancer-like",
                           3 : "Promoter-like"};
        //console.log(row, data, index);
        let klass = lookup[data.cregroup];
        $('td', row).eq(1)
                    .addClass(klass)
                    .attr("data-toggle", "tooltip")
                    .attr("title", lookupTitle[data.cregroup]);
    }

    table(data, actions){
	var tooMany = "";
	if(data.length < this.props.total){
	    tooMany = (
		<li className={"list-group-item"}>
		    <em>For performance, SCREEN cannot display more than 1,000 candidate Regulatory Elements (cREs) in this table. You may download the entire set of search results in bed or JSON format, or use the facets at left to narrow your search.</em>
		</li>);
	}
	var failMsg = "";
	if(this.props.missingAssays && this.props.missingAssays.length){
	    failMsg = (
		<li className={"list-group-item"}>
		    <em>The cell type you have selected does not have {this._format_message(this.props.missingAssays)} data available.</em>
		</li>);
	}

	let meetMsg = "";
	if(!isCart()){
	    meetMsg = (
		<li className={"list-group-item"}>
		    Candidate Regulatory Elements (cREs) that meet your search criteria are listed in the table below.
		</li>);
	}
	let click = "Click a cRE accession to view details about the cRE, including top tissues, nearby genomic features, etc.";
		    
	let geneView = "Click a gene ID to view the expression profile of the gene.";
	let diffExp = "";
	if("mm10" === GlobalAssembly){
	    diffExp = (
		<span>
		    {"Click the "}
		    <span>&Delta;</span>
		    {" following a gene ID to explore the differential expression of the gene between two cell types."}
		</span>);
	}

	let cols = (this.props.hasct ? this.props.missingAssays :
                    ["H3K4me3 ChIP-seq", "H3K27ac ChIP-seq", "CTCF ChIP-seq"]);

	let ctCol = null;
	if(this.props.cellType){
	    ctCol = this.props.make_ct_friendly(this.props.cellType)
	}

	return (
            <div ref={"searchTable"}
                 style={{display: (this.props.isFetching ? "none" : "block")}}>
		<div className={"searchTableNotes"}>
		    <ul className={"list-group searchTableNotesUl"}>
			{tooMany}
			{failMsg}
			{meetMsg}
			<ul className="creMsgs">
			    <li>{click}</li>
			    <li>{geneView}</li>
			    {diffExp && <li>{diffExp}</li>}
			</ul>
		    </ul>
		</div>

		<Ztable data={data}
                        order={table_order}
			columnDefs={columnDefs}
			cols={TableColumns(ctCol)}
                        onTdClick={(td, rowdata) =>
                            this.table_click_handler(td, rowdata, actions)}
                        cvisible={this._opposite(cols, this.props.cts)}
                        bFilter={true}
                        bLengthChange={true} key={this.props.cellType}
                />
	    </div>);
    }

    legend(){
	return (
	    <div className="panel panel-default">
		<div className="panel-body legendPanel">
		    <div className="row">
			<div className="col-md-2">
			    {Render.sctGroupIconLegend('P')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend('E')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend('C')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend('D')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend('I')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend('U')}
			</div>
		    </div>
		    <div className="row">
		    </div>
		    <div className="row">
			<div className="col-md-4">
			    <small><b>{"P/D"}</b>
				{" Proximal/Distal to a Transcription Start Site"}
			    </small>
			</div>
			<div className="col-md-8">
			    <span className="glyphicon glyphicon-star concordantStar" aria-hidden="true"></span>{" "}
			    <small>
				High DNase and High H3K4me3, H3K27ac, or CTCF in the same cell type
			    </small>
			</div>
		    </div>
		</div>
	    </div>
	);
    }
    
    render() {
	var data = [...this.props.data];
        var actions = this.props.actions;

	let cas = this.props.cart_accessions;
	for (var i in data) {
	    data[i].in_cart = cas.has(data[i].info.accession);
	}

	return (
	    <div style={{"width": "100%"}} className={"mainSearchTable"} >
                {loading(this.props)}
                {this.table(data, actions)}
                {this.tableFooter(data)}
		
		<div style={{display: (this.props.isFetching ? "none" : "block")}}>
		    <div className="row">
			<div className="col-md-12">
			    {this.legend()}
			</div>
		    </div>
		</div>
		
     	    </div>);
    }
}

export default TableWithCart;
