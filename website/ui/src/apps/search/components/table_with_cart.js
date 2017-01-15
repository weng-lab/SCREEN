var React = require('react');
import {connect} from 'react-redux'

import {array_contains, numberWithCommas} from '../../../common/common'
import {TOGGLE_CART_ITEM, TAB_ACTION} from '../reducers/root_reducer'
import {SELECT_TAB} from '../reducers/tab_reducer'
import ResultsDataTable from '../../../common/components/results_table'

import {invalidate_detail} from '../helpers/invalidate_results'
import FacetQueryMap from '../elasticsearch/facets_to_query'
import QueryAJAX, {format_query} from '../elasticsearch/ajax'

const table_click_handler = (td, rowdata, dispatch) => {
    if (td.className.indexOf("browser") != -1) return;
    if (td.className.indexOf("geneexp") != -1) return;
    if (td.className.indexOf("cart") != -1) {
	dispatch(toggle_cart_item(rowdata._source.accession));
	return;
    }
    dispatch(invalidate_detail(rowdata));
    dispatch({
	type: TAB_ACTION,
	target: "main_tabs",
	subaction: {
	    type: SELECT_TAB,
	    selection: "details"
	}
    });
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

    render() {
	var n_data = [...this.props.data];

	for (var i in n_data) {
	    n_data[i]._source.in_cart = array_contains(this.props.cart_list,
						       n_data[i]._source.accession);
	}

	return (<div style={{"width": "100%"}} className={"mainSearchTable"} >
		    <div className={"loading"} style={{"display": (this.props.fetching ? "block" : "none")}}>
		        Loading...
		    </div>
		    <ResultsDataTable data={n_data} cols={this.props.cols}
                onTdClick={this.props.onTdClick}
	        loading={this.props.fetching}
                onButtonClick={this.props.onButtonClick}
		order={this.props.order} bFilter={true} bLengthChange={true}
		onMouseEnter={true} onMouseExit={true}/>

                {this.tableFooter(n_data)}

     		</div>);
    }
}

export default TableWithCart;
