import React from 'react';
import {connect} from 'react-redux';

import ResultsTable from '../../../common/components/results_table';

import ResultsTableColumns, {table_order} from '../config/results_table';
import {numberWithCommas} from '../../../common/common';
import {getCommonState} from '../../../common/utility';

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
	success: (response) => {
	    if ("err" in response) {
		$("#errMsg").text(response["err"]);
		$("#errBox").show()
		return true;
	    }
	    //console.log(response["trackhubUrl"]);
	    window.open(response["url"], '_blank');
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
		return "displaying top " + data.length +
                " results of " + numberWithCommas(this.props.total) + " total";
        }
        return "found " + this.props.total + " results";
    }

    tableFooter(data){
	var total = this.totalText(data);
        return (<span className="tableInfo">

                <div className={"btn-group"} role={"group"}>
		<button type={"button"} className={"btn btn-default btn-xs"}
		onClick={() => {this.downloadBed()}}>Download bed</button>

		<button type={"button"} className={"btn btn-default btn-xs"}
		onClick={() => {this.downloadJSON()}}>Download JSON</button>
		</div>

		&nbsp;&nbsp;{total}
		</span>);
    }

    loading({isFetching}){
        return (<div className={"loading"}
                style={{"display": (isFetching ? "block" : "none")}}>
		Loading...
		</div>);
    }

    _format_message(a) {
	if (a.length == 0) return a;
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

    table(data, actions){
	var topmessage = (data.length < this.props.total ? <div><br />For performance, SCREEN cannot display more than 1,000 cREs in this table. You may download the entire set of search results in bed or JSON format, or use the facets at left to narrow your search.</div> : "");
	var tmsg2 = (this.props.nodnase && this.props.nodnase.length ? <div><br />The cell type you have selected does not have {this._format_message(this.props.nodnase)} data available.</div> : "");
	let cols = (this.props.hasct ? this.props.nodnase :
                    ["H3K4me3 ChIP-seq", "H3K27ac ChIP-seq", "CTCF ChIP-seq"]);
	return (<div>
		{topmessage}
		{tmsg2}<br />
		<ResultsTable data={data}
                order={table_order}
                cols={ResultsTableColumns}
                onTdClick={(td, rowdata) =>
                           table_click_handler(td, rowdata, actions)}
		cvisible={this._opposite(cols)}
                onButtonClick={(td, rowdata) =>
                               button_click_handler(td, rowdata, actions)}
		bFilter={true} bLengthChange={true}
		onMouseEnter={true} onMouseExit={true}/>
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
                {this.loading(this.props)}
                {this.table(data, actions)}
                {this.tableFooter(data)}
     		</div>);
    }
}

export default TableWithCart;
