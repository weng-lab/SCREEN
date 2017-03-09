import React from 'react';
import {connect} from 'react-redux';

import ResultsTable from '../../../common/components/results_table';

import TableColumns, {table_order, columnDefs} from '../config/table_with_cart';
import {numberWithCommas} from '../../../common/common';
import {getCommonState} from '../../../common/utility';
import loading from '../../../common/components/loading'

import * as Render from '../../../common/renders'
import {isCart} from '../../../common/utility'

const table_click_handler = (td, re, actions) => {
    if (td.className.indexOf("browser") != -1) return;
    if (td.className.indexOf("geneexp") != -1) return;
    if (td.className.indexOf("cart") != -1) {
	actions.toggleCart(re.accession);
	return;
    }
    actions.setMainTab("details");
    actions.showReDetail(re.accession)
};

const openGenomeBrowser = (data, url) => {
    $.ajax({
	type: "POST",
	url: url,
	data: data,
	dataType: "json",
	contentType : "application/json",
	async: false, // http://stackoverflow.com/a/20235765
	success: (r) => {
	    if ("err" in r) {
		$("#errMsg").text(r.err);
		$("#errBox").show()
		return true;
	    }
	    console.log(r.url, r.trackhubUrl);
	    window.open(r.url, '_blank');
	},
	error: (a, b, c) => {
	    console.log(a);
	}
    });
};

const button_click_handler = (name, re, dispatch) => {
    var half_window = 7500;
    var arr = window.location.href.split("/");
    var host = arr[0] + "//" + arr[2];
    var data = JSON.stringify({"accession" : re.accession,
                               "halfWindow" : half_window,
                               "host" : host,
			       GlobalAssembly});

    switch (name) {
    case "UCSC": openGenomeBrowser(data, "/ucsc_trackhub_url"); break;
    case "WashU": openGenomeBrowser(data, "/washu_trackhub_url"); break;
    case "Ensembl": openGenomeBrowser(data, "/ensembl_trackhub_url"); break;
    }
};

class TableWithCart extends React.Component {
    addAllToCart() {
	let accessions = this.props.data.map((d) => ( d.accession ));
	this.props.actions.addCart(accessions);
    }

    clearCart() {
	this.props.actions.clearCart();
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

    _opposite(a) {
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
	if(this.props.nodnase && this.props.nodnase.length){
	    failMsg = (
		<li className={"list-group-item"}>
		    <em>The cell type you have selected does not have {this._format_message(this.props.nodnase)} data available.</em>
		</li>);
	}

	let meetMsg = "";
	if(!isCart()){
	    meetMsg = (
		<li className={"list-group-item"}>
		Candidate Regulatory Elements (cREs) that meet your search criteria:
		</li>);
	}
	
	let cols = (this.props.hasct ? this.props.nodnase :
                    ["H3K4me3 ChIP-seq", "H3K27ac ChIP-seq", "CTCF ChIP-seq"]);

	return (
            <div ref={"searchTable"}
                 style={{display: (this.props.isFetching ? "none" : "block")}}>
		<div className={"searchTableNotes"}>
		    <ul className={"list-group searchTableNotesUl"}>
			{tooMany}
			{failMsg}
			{meetMsg}
		    </ul>
		</div>

		<ResultsTable data={data}
                              order={table_order}
			      columnDefs={columnDefs}
                              cols={TableColumns()}
                              onTdClick={(td, rowdata) =>
                                  table_click_handler(td, rowdata, actions)}
                              cvisible={this._opposite(cols)}
                              onButtonClick={(td, rowdata) =>
                                  button_click_handler(td, rowdata, actions)}
                              bFilter={true} bLengthChange={true}
                />
	    </div>);
    }

    render() {
	var data = [...this.props.data];
        var actions = this.props.actions;

	let cas = this.props.cart_accessions;
	for (var i in data) {
	    data[i].in_cart = cas.has(data[i].accession);
	}

	return (<div style={{"width": "100%"}} className={"mainSearchTable"} >
                {loading(this.props)}
                {this.table(data, actions)}
                {this.tableFooter(data)}
     		</div>);
    }
}

export default TableWithCart;
