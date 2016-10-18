var React = require('react');
import {connect} from 'react-redux'

import {array_contains} from '../../../common/common'
import {TOGGLE_CART_ITEM, SELECT_TAB} from '../reducers/root_reducer'
import ResultsDataTable from '../../../common/components/results_table'

import {button_click_hander} from '../../search/components/table_with_cart'
import {invalidate_detail} from '../../search/helpers/invalidate_results'
import {invalidate_results} from '../helpers/invalidate_results'

class ResultsTable extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<div style={{"width": "100%"}}>
		    <div style={{"display": (this.props.fetching ? "block" : "none"), "fontSize": "20pt",
			         "fontWeight": "bold", "textAlign": "center", "verticalAlign": "middle"}}>
		        Loading...
		    </div>
		    <ResultsDataTable data={this.props.data} cols={this.props.cols} onTdClick={this.props.onTdClick}
	                loading={this.props.fetching} onButtonClick={this.props.onButtonClick} order={this.props.order} />
		</div>);
    }

    componentDidMount() {
	this.props.store.dispatch(invalidate_results(this.props.store.getState()));
    }
    
}
export default ResultsTable;

const table_click_handler = (td, rowdata, dispatch) => {
    if (td.className.indexOf("browser") != -1) return;
    dispatch(invalidate_detail(rowdata));
    dispatch({
	type: SELECT_TAB,
	selection: "details"
    });
};

const table_props_map = (state) => {
    return {
	data: state.results.hits,
	order: state.results.order,
	cols: state.results.columns,
	fetching: state.results.fetching
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
