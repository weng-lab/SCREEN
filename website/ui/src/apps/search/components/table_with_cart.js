var React = require('react');
import {connect} from 'react-redux'

import {array_contains} from '../../../common/common'
import {TOGGLE_CART_ITEM, TAB_ACTION} from '../reducers/root_reducer'
import {SELECT_TAB} from '../reducers/tab_reducer'
import ResultsDataTable from '../../../common/components/results_table'

import {invalidate_detail} from '../helpers/invalidate_results'

class TableWithCart extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var n_data = [...this.props.data];
	var total = (n_data.length < this.props.total
		     ? "displaying top " + n_data.length + " results of " + this.props.total + " total"
		     : "found " + this.props.total + " results");
	for (var i in n_data) {
	    n_data[i]._source.in_cart = array_contains(this.props.cart_list,
						       n_data[i]._source.accession);
	}
	return (<div style={{"width": "100%"}}>
		    <div className={"loading"} style={{"display": (this.props.fetching ? "block" : "none")}}>
		        Loading...
		    </div>
		    <ResultsDataTable data={n_data} cols={this.props.cols} onTdClick={this.props.onTdClick}
	                loading={this.props.fetching} onButtonClick={this.props.onButtonClick}
		        order={this.props.order} bFilter={true} bLengthChange={true} />
		    <span className="tableInfo">{total}</span>
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

const button_click_handler = (button, rowdata, dispatch) => {

    var half_window = 7500;
    var arr = window.location.href.split("/");
    var host = arr[0] + "//" + arr[2];
    var data = JSON.stringify({"re" : rowdata._source,
	                       "chrom" : rowdata._source.position.chrom,
                               "start" : rowdata._source.position.start,
                               "end" : rowdata._source.position.end,
                               "halfWindow" : half_window,
                               "host" : host});

    switch (button) {
    case "UCSC":
        $.ajax({
            type: "POST",
            url: "/ucsc_trackhub_url",
            data: data,
            dataType: "json",
            contentType : "application/json",
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
	break;
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

const table_dispatch_map = (dispatch) => {
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
