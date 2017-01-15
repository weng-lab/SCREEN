import React from 'react'
import {connect} from 'react-redux';

import ResultsTable from '../../../common/components/results_table'
import BarGraphTable from '../components/bar_graph_table'

function chunkArr(arr, chunk){
    // from https://jsperf.com/array-splice-vs-underscore
    // TODO: move to common
    var i, j, temparray = [];
    for (i = 0, j = arr.length; i < j; i += chunk) {
	temparray.push(arr.slice(i, i + chunk));
    }
    return temparray;
}

class DetailsApp extends React.Component {
    constructor(props) {
	super(props);
    }

    barGraphTable(table, _data){
	return <BarGraphTable
        cols={table.cols} order={table.order} paging={table.paging}
	bInfo={table.bInfo} bFilter={table.bFilter} data={_data}
	bLengthChange={false} emptyText={table.emptyText}
	pageLength={table.pageLength} rank_f={table.bg_rank_f} />;
    }

    resultsTable(table, _data){
	var tclick = (table.onTdClick ? table.onTdClick(dispatch) : null);
	return <ResultsTable
        cols={table.cols} order={table.order} paging={table.paging}
	bInfo={table.bInfo} bFilter={table.bFilter} data={_data}
	bLengthChange={true} emptyText={table.emptyText}
        pageLength={table.pageLength}
  	onTdClick={tclick} />;
    }

    render() {
	var tabs = this.props.tabs;
	var tables = this.props.tables;
	var data = this.props.data;
	var tab_selection = this.props.tab_selection;

	function makeTable(key, table){
	    var _data = (data[key] ? data[key] : []);
	    if(table.bar_graph){
		return barGraphTable(table, _data);
	    }
            return resultsTable(table, _data);
	}

	function tabEle(key, table, numCols) {
	    return (<div className={"col-md-" + (12/numCols)} key={key}>
		        <h4>{table.title}</h4>
		        {makeTable(key, table)}<br/>
		    </div>);
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

	// only showed enabled tabs
	var tabsf = tabs.filter(t => t.enabled)

	return (<div className="container" style={{width: "100%"}}>
		    <h3>{this.props.q.accession}</h3>
		    <ul className="nav nav-tabs">
  		    {Object.keys(tabsf).map((k) => (
			    <li key={"tab_" + k} className={k == tab_selection ? "active" : ""} >
				<a onClick={() => {onClick(k, dispatch)}}>{tabsf[k].title}</a>
		            </li>
		        ))}
		    </ul>
		    <div className="tab-content clearfix">
		        {Object.keys(tabsf).map((k) => {
		            if (k != tab_selection) return <div />;
		            var tab = tabsf[k];
			    var content = (tab.render ? tab.render(store, k) : tabEles(tab.tables, tab.numCols));
			    return (<div className={k == tab_selection ? "tab-pane active" : "tab-pane"} id={"tab_" + k} key={"tpane_" + k}>
		                        {content}
				    </div>);
			})}
		    </div>
		</div>);
    }

}
export default DetailsApp;

const props_map = (state) => {
    return {
	q: state.re_detail.q,
	data: state.re_detail.data,
	tab_selection: state.re_detail.tab_selection
    };
};

export const details_connector = connect(props_map);
