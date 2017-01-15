var React = require('react');
import {connect} from 'react-redux'

import ResultsDataTable from '../../../common/components/results_table'

import ResultsTableColumns, {table_order} from '../config/results_table'
import {numberWithCommas} from '../../../common/common'

const table_click_handler = (td, rowdata, actions) => {
    if (td.className.indexOf("browser") != -1) return;
    if (td.className.indexOf("geneexp") != -1) return;
    if (td.className.indexOf("cart") != -1) {
	actions.toggleCart(rowdata.accession);
	return;
    }
    actions.setMainTab("details");
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

const button_click_handler = (name, rowdata, dispatch) => {
    var re = rowdata._source;
    var half_window = 7500;
    var arr = window.location.href.split("/");
    var host = arr[0] + "//" + arr[2];
    var data = JSON.stringify({"accession" : re["accession"],
                               "halfWindow" : half_window,
                               "host" : host});

    switch (name) {
    case "UCSC": openGenomeBrowser(data, "/ucsc_trackhub_url"); break;
    case "WashU": openGenomeBrowser(data, "/washu_trackhub_url"); break;
    case "Ensembl": openGenomeBrowser(data, "/ensembl_trackhub_url"); break;
    }
};

class TableWithCart extends React.Component {
    downloadBed() {
	var n_query = FacetQueryMap(this.props.store.getState());
	$.ajax({
            type: "POST",
            url: "beddownload",
            data: format_query(n_query),
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
	var n_query = FacetQueryMap(this.props.store.getState());
	var formData = JSON.stringify({});
	$.ajax({
            type: "POST",
            url: "jsondownload",
            data: format_query(n_query),
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

    loading({fetching}){
        return (<div className={"loading"}
                style={{"display": (fetching ? "block" : "none")}}>
		Loading...
		</div>);
    }

    table(data, actions){
	return (<ResultsDataTable data={data}
                order={table_order}
                cols={ResultsTableColumns}
                onTdClick={(td, rowdata) =>
                           table_click_handler(td, rowdata, actions)}
                onButtonClick={(td, rowdata) =>
                               button_click_handler(td, rowdata, actions)}
		bFilter={true} bLengthChange={true}
		onMouseEnter={true} onMouseExit={true}/>);
    }

    render() {
	var data = [...this.props.data];
        var actions = this.props.actions;

	for (var i in data) {
	    data[i].in_cart = this.props.cart_accessions.has(data[i].accession);
	}

	return (<div style={{"width": "100%"}} className={"mainSearchTable"} >
                {this.loading(this.props)}
                {this.table(data, actions)}
                {this.tableFooter(data)}
     		</div>);
    }
}

export default TableWithCart;
