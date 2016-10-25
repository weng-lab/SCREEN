var React = require('react');
import {connect} from 'react-redux';

import {SET_DETAIL_TAB} from '../reducers/root_reducer'

import ResultsTable from '../../../common/components/results_table'
import BarGraphTable from '../components/bar_graph_table'

const set_tab_selection = (k) => {
    return {
	type: SET_DETAIL_TAB,
	tab_selection: k
    };
};

class DetailsApp extends React.Component {

    constructor(props) {
	super(props);
    }
    
    render() {
	var tabs = this.props.tabs;
	var tables = this.props.tables;
	var data = this.props.data;
	var dispatch = this.props.store.dispatch;

	function makeTable(key, table){
	    if(table.bar_graph){
		return <BarGraphTable cols={table.cols} order={table.order} paging={table.paging}
			    bInfo={table.bInfo} bFilter={table.bFilter} data={data[key]}
			    bLengthChange={false} emptyText={table.emptyText}
			    pageLength={table.pageLength} rank_f={table.bg_rank_f} />;
	    }
	    var tclick = (table.onTdClick ? table.onTdClick(dispatch) : null);
	    return <ResultsTable cols={table.cols} order={table.order} paging={table.paging}
		       bInfo={table.bInfo} bFilter={table.bFilter} data={data[key]}
	               bLengthChange={true} emptyText={table.emptyText} pageLength={table.pageLength}
  	               onTdClick={tclick} />;
	}
	
	function tabEle(key, table, numCols) {
	    return (<div className={"col-md-" + (12/numCols)} key={key}>
		        <h4>{table.title}</h4>
		        {makeTable(key, table)}<br/>
		    </div>);
	}

	function chunkArr(arr, chunk){
	    // from https://jsperf.com/array-splice-vs-underscore
	    // TODO: move to common
	    var i, j, temparray = [];
	    for (i = 0, j = arr.length; i < j; i += chunk) {
		temparray.push(arr.slice(i, i + chunk));
	    }
	    return temparray;
	}
	
	function tabEles(tables, numCols = 4){
	    var cols = [];
	    for(var key of Object.keys(tables)){
		cols.push(tabEle(key, tables[key], numCols));
	    };
	    if(0 == numCols){
		return cols;
	    }
	    var chunks = chunkArr(cols, numCols);
	    var ret = []
	    for(var i = 0; i < chunks.length; i++) {
		var chunk = chunks[i];
		ret.push(<div className="row" key={"chunk" + i}>{chunk}</div>);
	    }
	    return (<div>{ret}</div>);
	}
	
	return (<div className="container" style={{width: "100%"}}>
		    <h3>{this.props.q.accession}</h3>
		    <ul className="nav nav-tabs">
  		        {Object.keys(tabs).map((k) => (
			    <li key={"tab_" + k} className={k == this.props.tab_selection ? "active" : ""} >
				<a href="#" onClick={() => {this.props.store.dispatch(set_tab_selection(k))}}>{tabs[k].title}</a>
		            </li>
		        ))}
		    </ul>
		    <div className="tab-content clearfix">
		        {Object.keys(tabs).map((k) => {
		            var tab = tabs[k];
			    return (<div className={k == this.props.tab_selection ? "tab-pane active" : "tab-pane"} id={"tab_" + k} key={"tpane_" + k}>
		                        {tabEles(tab.tables, tab.numCols)}
				    </div>);
			})}
		    </div>
		</div>);
    }
    
}
export default DetailsApp;

const props_map = (state) => {
    console.log(state);
    return {
	q: state.re_detail.q,
	data: state.re_detail.data,
	tab_selection: state.re_detail.tab_selection
    };
};

export const details_connector = connect(props_map);
