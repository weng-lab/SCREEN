import React from 'react';
import {Form, FormGroup, FormControl, Pagination, HelpBlock } from 'react-bootstrap';
import {Enum} from 'enumify';

//const firstBy = require('thenby');

class SortOrder extends Enum {
    cycleOrder(){
        switch (this) {
	    case SortOrder.DISABLED:
		return SortOrder.DISABLED;
	    case SortOrder.NONE:
		return SortOrder.ASC;
	    case SortOrder.ASC:
		return SortOrder.DSC;
	    case SortOrder.DSC:
		return SortOrder.ASC;
	    default:
		return SortOrder.NONE;
	}
    }
}
SortOrder.initEnum(['ASC', 'DSC', 'NONE', 'DISABLED']);

class SortCols {
    constructor(){
	this.sortCols = [];
	this.keys = {};
    }

    shouldSort(){
	return this.sortCols.length > 0;
    }
    
    colClick(colInfo, curOrder){
	let m = new SortCols();
	const newOrder = curOrder.cycleOrder();
	m.sortCols = [colInfo.data, newOrder]
	m.keys[colInfo.data] = newOrder;
	return m;
    }

    getHeaderKlass(colInfo){
	let sk = "table-sort";
	let so = SortOrder.NONE;
	if("orderable" in colInfo){
	    if(!colInfo.orderable){
		so = SortOrder.DISABLED;
	    }
	}
	if(colInfo.data in this.keys){
	    const sortOrder = this.keys[colInfo.data];
	    if(SortOrder.ASC === sortOrder){
		sk = "table-sort-asc";
		so = SortOrder.ASC;
	    } else if(SortOrder.DSC === sortOrder){
		sk = "table-sort-desc";
		so = SortOrder.DSC;
	    }
	}
	return { sk, so };
    }
}

const filterVisibleCols = (cols) => (
    cols.filter((c) => {
	if("visible" in c){
	    return c["visible"];
	}
	return true;
    })
)

const klassName = (colInfo) => {
    let k = "";
    if("className" in colInfo){
	k = colInfo.className;
    }
    return k;
}

class SearchBox extends React.Component {
    render() {
	return (
		<div style={{float: "right"}}>
	    <Form inline>
		<FormGroup controlId = "formBasicText">
		    Search:
		    <FormControl bsSize = "small"
				 size = "15"
				 type = "text"
				 value = {this.props.value}
				 onChange = {this.props.onChange}/>
		    <FormControl.Feedback />
		</FormGroup>
	    </Form>
		</div>
	);
    }
}

class PageBox extends React.Component {
    render(){
	return (
	    <Pagination className="users-pagination pull-right"
			bsSize="small"
			maxButtons={ 3 }
			first last next prev boundaryLinks
			items={this.props.pages}
			activePage={this.props.curPage}
			onSelect={this.props.onSelect}
	    />);
    }
}
	    
class Zheader extends React.Component {
    render(){
	return (
	    <tr>
		{this.props.colInfos.map((colInfo, idx) => {
		     let k = "text-center " + klassName(colInfo);
		     let {sk, so} = this.props.sortCols.getHeaderKlass(colInfo);
		     k += ' ' + sk;
		     return (
			 <th className={k}
			     key={idx}
			     onClick={this.props.onClick(colInfo, so)}>
			     {colInfo.title}
			 </th>);
		 })}
	    </tr>);
    }
}

class Zrow extends React.Component {
    render(){
	let rowData = this.props.colInfos.map((colInfo) => {
	    let k = klassName(colInfo);
	    if("defaultContent" in colInfo){
		return [colInfo.defaultContent, k];
	    }
	    let rd =  this.props.row[colInfo.data];	    
	    if("render" in colInfo){
		try {
		    const rend = colInfo.render(rd);
		    return [rend, k]
		} catch(err){
		    console.log("Zrow: error when rendering: row col data was:", rd);
		    console.log("Zrow: error when rendering: row data was:", this.props.row);
		    console.log("Zrow: error when rendering: row klass was:", k);
		    console.log("Zrow: error when rendering: colInfo was:", colInfo);
		    throw err;
		}
	    }
	    return [rd, k];
	});

	return (
	    <tr>
		{rowData.map((r, idx) => {
		     const k = "text-center " + r[1];
		     return (
			 <td className={k}
			     key={this.props.dataIdx.toString() + '_' + idx.toString()}
			     onClick={this.props.onRowClick(k,
							    this.props.dataIdx)}
			 >
			     {r[0]}
			 </td>);
		})}
	    </tr>);
    }
}

class DataSource {
    constructor(data, cols) {
	this.data = data;
	this.cols = cols;

	this.colsByData = {}
	this.cols.forEach((col) => {
	    this.colsByData[col.data] = col;
	});
    }

    filterAndSort(state){
	this._searchFilter(state.search);
	this._sort(state.sortCols);

	this.numPages = Math.ceil(this.rowIDs.length / state.pageSize);
	// page indexes are 1-based
	this.rowStart = (state.pageNum - 1) * state.pageSize;
	this.rowEnd = state.pageNum * state.pageSize;
    }

    _searchFilter(s){
	let ret = [];
	for(let i = 0; i < this.data.length; i++){
	    if(!s){
		ret.push(i);
		continue;
	    }
	    for(let colInfo of this.cols){
		const t = String(this.data[i][colInfo.data]).toLowerCase();
		if(t.includes(s)){
		    ret.push(i);
		    break;
		}
	    }
	}
	this.rowIDs = ret;
    }

    _sortByColNumeric(sortCol, sortOrder, sortDataF){
	if(SortOrder.ASC === sortOrder){
	    if(sortDataF){
		this.rowIDs.sort((a,b) => sortDataF(this.data[a][sortCol]) -
					sortDataF(this.data[b][sortCol]));
	    } else {
		this.rowIDs.sort((a,b) => this.data[a][sortCol] -
					this.data[b][sortCol]);
	    }
	} else {
	    if(sortDataF){
		this.rowIDs.sort((a,b) => sortDataF(this.data[b][sortCol]) -
					sortDataF(this.data[a][sortCol]));
	    } else {
		this.rowIDs.sort((a,b) => this.data[b][sortCol] -
					this.data[a][sortCol]);
	    }
	}
    }

    _sortByColStr(sortCol, sortOrder, sortDataF){
	// sort by strings, from https://stackoverflow.com/a/9645447
	if(SortOrder.ASC === sortOrder){
	    if(sortDataF){
		console.log("sorting", sortCol, "by text, asceding, with custom data");
		this.rowIDs.sort((a,b) =>
		    sortDataF(this.data[a][sortCol]).toLowerCase().localeCompare(
			sortDataF(this.data[b][sortCol]).toLowerCase()));
	    } else {
		console.log("sorting", sortCol, "by text, asceding, without custom data");
		this.rowIDs.sort((a,b) =>
		    this.data[a][sortCol].toLowerCase().localeCompare(
			this.data[b][sortCol].toLowerCase()));
	    }
	} else {
	    console.log("sorting by", sortCol, "text, descending, with custom data");
	    if(sortDataF){
		this.rowIDs.sort((a,b) =>
		    sortDataF(this.data[b][sortCol]).toLowerCase().localeCompare(
			sortDataF(this.data[a][sortCol]).toLowerCase()));
	    } else {
		console.log("sorting", sortCol, "by text, descending, without custom data");
		this.rowIDs.sort((a,b) =>
		    this.data[b][sortCol].toLowerCase().localeCompare(
			this.data[a][sortCol].toLowerCase()));
	    }
	}
    }
    
    _sort(sortCols){
	if(!sortCols.shouldSort()){
	    return;
	}
	if(0 === this.rowIDs.length){
	    return;
	}

	const sortOrder = sortCols.sortCols[1];
	const sortCol = sortCols.sortCols[0];
	
	const sample = this.data[this.rowIDs[0]][sortCol];
	const colInfo = this.colsByData[sortCol];

	let sortDataF = null;
	if("sortDataF" in colInfo){
	    sortDataF = colInfo.sortDataF;
	}
	
	// https://stackoverflow.com/a/16655847
	const isNumArray = Number(sample) === sample;
	if(isNumArray){
	    this._sortByColNumeric(sortCol, sortOrder, sortDataF);
	} else {
	    this._sortByColStr(sortCol, sortOrder, sortDataF);
	}
    }
}

class Ztable extends React.Component {
    constructor(props) {
        super(props);
	this.state = {search: '',
		      pageNum: 1, // page indexes are 1-based
		      pageSize: 10,
		      sortCols: new SortCols()};
    }
    
    render(){
	const searchBoxChange = (e) => {
	    this.setState({search: e.target.value,
			   pageNum: 1});
	};

	const pageClick = (e) => {
	    this.setState({pageNum: e});
	};

	const sortClick = (colInfo, curOrder) => () => {
	    if(SortOrder.DISABLED === curOrder){
		return;
	    }
	    const m = this.state.sortCols.colClick(colInfo, curOrder);
	    this.setState({sortCols: m});
	};

	const rowClick = (klasses, dataIdx) => (e) => {
	    if(this.props.onTdClick){
		this.props.onTdClick(klasses, this.props.data[dataIdx]);
	    }
	};
	
	let ds = new DataSource(this.props.data, this.props.cols);
	ds.filterAndSort(this.state);

	let tableKlass = "table table-bordered-bottom table-condensed table-hover";
	let visibleCols = filterVisibleCols(this.props.cols);
	
	return (
	    <div style={{width: "100%"}}>
		<SearchBox value={this.state.search} onChange={searchBoxChange} />
		<table className={tableKlass}>
		    <thead>
			<Zheader colInfos={visibleCols}
				 sortCols={this.state.sortCols}
				 onClick={sortClick}
			/>
		    </thead>
		    <tbody>
			{ds.rowIDs.slice(ds.rowStart, ds.rowEnd).map((idx) => (
			     <Zrow row={this.props.data[idx]}
				   key={idx}
				   dataIdx={idx}
				   onRowClick={rowClick}
				   colInfos={visibleCols} />
			 ))}
		    </tbody>
		</table>
		{ds.numPages > 1 && <PageBox pages={ds.numPages}
					     curPage={this.state.pageNum}
					     onSelect={pageClick} />}
		<HelpBlock>Found {ds.rowIDs.length}</HelpBlock>
	    </div>);
    }
}

export default Ztable;
