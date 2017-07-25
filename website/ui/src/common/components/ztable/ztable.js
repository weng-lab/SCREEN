import React from 'react';

import {Form, FormGroup, FormControl, Nav, Pagination, HelpBlock } from 'react-bootstrap';

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
	    <Nav pullRight>
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
	    </Nav>
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
		{this.props.colInfos.map((col) => {
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
		{rowData.map((r) => {
		     let k = "text-center " + r[1];
		     return (
			 <td className={k}
			     onClick={this.props.onRowClick(k,
							    this.props.dataIdx)}
			 >
			     {r[0]}
			 </td>);
		})}
	    </tr>);
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

    searchFilter(){
	let ret = [];
	let s = this.state.search;
	for(let i = 0; i < this.props.data.length; i++){
	    if(!this.state.search){
		ret.push(i);
		continue;
	    }
	    for(let colInfo of this.props.cols){
		let t = String(this.props.data[i][colInfo.data]).toLowerCase();
		if(t.includes(s)){
		    ret.push(i);
		    break;
		}
	    }
	}
	return ret;
    }

    sort(rowIDs){
	let c = this.state.sortCol;
	if(!c){
	    return rowIDs;
	}
	if(0 === rowIDs.length){
	    return rowIDs;
	}
	let sample = this.props.data[rowIDs[0]][c];

	// https://stackoverflow.com/a/16655847
	let isNumArray = Number(sample) === sample; 
	if(isNumArray){
	    if(1 === this.state.sortOrder){ // ascending
		return rowIDs.sort((a,b) => this.props.data[a][c] -
					  this.props.data[b][c]);
	    }
	    return rowIDs.sort((a,b) => this.props.data[b][c] -
				      this.props.data[a][c]);
	}
	// sort by strings https://stackoverflow.com/a/9645447
	if(1 === this.state.sortOrder){ // ascending
	    return rowIDs.sort((a,b) =>
		this.props.data[a][c].toLowerCase().localeCompare(
		    this.props.data[b][c].toLowerCase())
	    )
	}
	return rowIDs.sort((a,b) =>
	    this.props.data[b][c].toLowerCase().localeCompare(
		this.props.data[a][c].toLowerCase())
	)
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
	    this.props.onTdClick(klasses, this.props.data[dataIdx]);
	};
	
	let rowIDs = this.searchFilter();
	rowIDs = this.sort(rowIDs);
	
	let numPages = Math.ceil(rowIDs.length / this.state.pageSize);
	// page indexes are 1-based
	let rowStart = (this.state.pageNum - 1) * this.state.pageSize;
	let rowEnd = this.state.pageNum * this.state.pageSize;
	
	let tableKlass = "table table-bordered table-condensed table-hover";
	let visibleCols = filterVisibleCols(this.props.cols);
	
	return (
	    <div style={{width: "100%"}}>
		<SearchBox value={this.state.search} onChange={searchBoxChange} />
		<table className={tableKlass}>
		    <Zheader colInfos={visibleCols}
			     sortCol={this.state.sortCol}
			     sortOrder={this.state.sortOrder}
			     onClick={sortClick}
		    />
		    {rowIDs.slice(rowStart, rowEnd).map((idx) => (
			 <Zrow row={this.props.data[idx]}
			       dataIdx={idx}
			       onRowClick={rowClick}
			       colInfos={visibleCols} />
		    ))}
		</table>
		<PageBox pages={numPages}
			 curPage={this.state.pageNum}
			 onSelect={pageClick} />
		<HelpBlock>Found {rowIDs.length}</HelpBlock>
	    </div>);
    }
}

export default Ztable;
