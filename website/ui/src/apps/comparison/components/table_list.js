import ResultsDataTable from '../../../common/components/results_table'

import {numberWithCommas} from '../../../common/common'
import {connect} from 'react-redux'

import {table_dispatch_map} from '../../search/components/table_with_cart'

class TableList extends React.Component {

    constructor(props) {
	super(props);
	this.tabClick = this.tabClick.bind(this);
	this.state = {
	    selection: 0
	};
    }

    tabClick(i) {
	this.setState({
	    selection: i
	});
    }

    reorder(t, o) {
	if (!o) return t;
	var r = [];
	o.map((k) => {
	    t.map((t) => {if (t.title == k) r.push(t)});
	});
	return r;
    }

    render() {
	var onTdClick = this.props.onTdClick;
	var onButtonClick = this.props.onButtonClick;
	var loading = this.props.loading;
	var selection = this.state.selection;
	var tables = this.reorder(this.props.tables, this.props.render_order);
	var tabClick = this.tabClick;
	var tabs = tables.map((t, i) => (
		<li className={i == selection ? "active" : ""} key={"tab_" + i}>
	           <a data-toggle="tab" onClick={() => {tabClick(i);}}>{t.title.replace(/_/g, " ")}</a>
	        </li>
	));
	var tab_contents = tables.map((t, i) => {
	    var total = (t.total < 100
			 ? "found " + t.total + " results"
			 : "displaying top 100 results of " + t.total + " total");
	    return <div className={i == selection ? "tab-pane active" : "tab-pane"} key={"tab_" + i}>
		      <ResultsDataTable data={t.data} cols={t.cols} onTdClick={onTdClick} loading={loading}
  	                 order={t.order} bFilter={true} bLengthChange={true} onButtonClick={onButtonClick} />
		      <span className="tableInfo">{total}</span>
		   </div>;
	});
	return (<div id="exTab1" className="container">
		   <ul className="nav nav-tabs">{tabs}</ul>
		   <div className="tab-content clearfix">{tab_contents}</div>
		</div>);
    }
    
}
export default TableList;

const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	tables: state.tables,
	loading: state.loading,
	render_order: state.render_order,
	cart_list: _state.results.cart_order
    };
};

const dispatch_map = (f) => (_dispatch) => (
    table_dispatch_map(f(_dispatch))
);

export const tablelist_connector = (pf, df) => connect(props_map(pf), dispatch_map(df));
