import React from 'react';
import {Form, FormGroup, FormControl, Pagination, HelpBlock } from 'react-bootstrap';
const firstBy = require('thenby');

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
	);
    }
}

class PageBox extends React.Component {
    render(){
	return (
	    <Pagination className="users-pagination pull-right"
			bsSize="medium"
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
		{this.props.colInfos.map((col, idx) => {
		     let k = "text-center " + klassName(col);
		     let sk = "table-sort"; // sort CSS class
		     let so = 0; // sort order
		     if("orderable" in col){
			 if(!col.orderable){
			     so = -1;
			 }
		     }
		     if(col.data === this.props.sortCol){
			 if(1 === this.props.sortOrder){
			     sk = "table-sort-asc";
			     so = 1;
			 } else if(2 === this.props.sortOrder){
			     sk = "table-sort-desc";
			     so = 2;
			 }
		     }
		     k += ' ' + sk;
		     return (
			 <th className={k}
			     key={idx}
			     onClick={this.props.onClick(col.data, so)}>
			     {col.title}
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
		return [colInfo.render(rd), k];
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
    }

    filterAndSort(state){
	let rowIDs = this._searchFilter(state.search);
	this.rowIDs = this._sort(state.sortCol, state.sortOrder, rowIDs);

	this.numPages = Math.ceil(rowIDs.length / state.pageSize);
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
	return ret;
    }

    _sort(sortCol, sortOrder, rowIDs){
	if(!sortCol){
	    return rowIDs;
	}
	if(0 === rowIDs.length){
	    return rowIDs;
	}
	const sample = this.data[rowIDs[0]][sortCol];
	// https://stackoverflow.com/a/16655847
	const isNumArray = Number(sample) === sample; 

	// sort numerically
	if(isNumArray){
	    if(1 === sortOrder){ // ascending
		return rowIDs.sort((a,b) => this.data[a][sortCol] -
					  this.data[b][sortCol]);
	    }
	    return rowIDs.sort((a,b) => this.data[b][sortCol] -
				      this.data[a][sortCol]);
	}
	
	// sort by strings, from https://stackoverflow.com/a/9645447
	if(1 === sortOrder){ // ascending
	    return rowIDs.sort((a,b) =>
		this.data[a][sortCol].toLowerCase().localeCompare(
		    this.data[b][sortCol].toLowerCase())
	    )
	}
	return rowIDs.sort((a,b) =>
	    this.data[b][sortCol].toLowerCase().localeCompare(
		this.data[a][sortCol].toLowerCase())
	)
    }
}

class Ztable extends React.Component {
    constructor(props) {
        super(props);
	this.state = {search: '',
		      pageNum: 1, // page indexes are 1-based
		      pageSize: 10,
		      sortCol: '',
		      sortOrder: 0};
    }

    render(){
	const searchBoxChange = (e) => {
	    this.setState({search: e.target.value,
			   pageNum: 1});
	};

	const pageClick = (e) => {
	    this.setState({pageNum: e});
	};

	const sortClick = (col, curOrder) => () => {
	    if(-1 === curOrder){
		return;
	    }
	    const nextSortOrder = {0:1, 1:2, 2:1}; // sort col cycle
	    this.setState({sortCol : col,
			   sortOrder : nextSortOrder[curOrder]});
	};

	const rowClick = (klasses, dataIdx) => (e) => {
	    if(this.props.onTdClick){
		this.props.onTdClick(klasses, this.props.data[dataIdx]);
	    }
	};
	
	let ds = new DataSource(this.props.data, this.props.cols);
	ds.filterAndSort(this.state);
	
	let tableKlass = "table table-bordered table-condensed table-hover";
	let visibleCols = filterVisibleCols(this.props.cols);
	
	return (
	    <div style={{width: "100%"}}>
		<SearchBox value={this.state.search} onChange={searchBoxChange} />
		<table className={tableKlass}>
		    <thead>
			<Zheader colInfos={visibleCols}
				 sortCol={this.state.sortCol}
				 sortOrder={this.state.sortOrder}
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
		<PageBox pages={ds.numPages}
			 curPage={this.state.pageNum}
			 onSelect={pageClick} />
		<HelpBlock>Found {ds.rowIDs.length}</HelpBlock>
	    </div>);
    }
}

export default Ztable;
