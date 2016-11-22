var React = require('react');
import {connect} from 'react-redux'

import {array_contains, numberWithCommas} from '../../../common/common'
import {TOGGLE_CART_ITEM, TAB_ACTION} from '../reducers/root_reducer'
import {SELECT_TAB} from '../reducers/tab_reducer'
import ResultsDataTable from '../../../common/components/results_table'

import {invalidate_detail} from '../helpers/invalidate_results'

class TableWithCart extends React.Component {

    constructor(props) {
	super(props);
    }

    downloadBed() {
	console.log("download bed");
    }

    downloadJSON() {
	console.log("download JSON");
    }
    
    render() {
	var n_data = [...this.props.data];
	var total = (n_data.length < this.props.total
		     ? "displaying top " + n_data.length + " results of " + numberWithCommas(this.props.total) + " total"
		     : "found " + this.props.total + " results");
	for (var i in n_data) {
	    n_data[i]._source.in_cart = array_contains(this.props.cart_list,
						       n_data[i]._source.accession);
	}
	return (<div style={{"width": "100%"}} className={"mainSearchTable"} >
		    <div className={"loading"} style={{"display": (this.props.fetching ? "block" : "none")}}>
		        Loading...
		    </div>
		    <ResultsDataTable data={n_data} cols={this.props.cols} onTdClick={this.props.onTdClick}
	                loading={this.props.fetching} onButtonClick={this.props.onButtonClick}
		order={this.props.order} bFilter={true} bLengthChange={true}
		onMouseEnter={true} onMouseExit={true}/>
		<span className="tableInfo">
		<div className={"btn-group"} role={"group"}>
		<button type={"button"} className={"btn btn-default btn-xs"}
		onClick={() => {this.downloadBed()}}>Download bed</button>
		<button type={"button"} className={"btn btn-default btn-xs"}
		onClick={() => {this.downloadJSON()}}>Download JSON</button>
		</div>
		&nbsp;&nbsp;{total}
		</span>
		</div>);
    }
}

export default TableWithCart;

export const toggle_cart_item = (accession) => {
    return {
	type: TOGGLE_CART_ITEM,
	accession
    };
};

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

const table_props_map = (state) => {
    return {
	data: state.results.hits,
	cart_list: state.results.cart_list,
	order: state.results.order,
	cols: state.results.columns,
	fetching: state.results.fetching,
	total: state.results.total
    };
};

export const table_dispatch_map = (dispatch) => {
    var retval = {
	onTdClick: (td, rowdata) => {
	    table_click_handler(td, rowdata, dispatch);
	},
	onButtonClick: (button, rowdata) => {
	    button_click_handler(button, rowdata, dispatch);
	}
    };
    return retval;
};

export const table_connector = connect(table_props_map, table_dispatch_map);
