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
	let visibleCols = filterVisibleCols(this.props.colInfos);
	
	let rowData = visibleCols.map((colInfo) => (
	    [colInfo.title, klassName(colInfo)]
	));
	
	return (
	    <tr>
		{rowData.map((r) => {
		    let k = "text-center " + r[1];
		    return (<th className={k}>{r[0]}</th>);
		})}
	    </tr>);
    }
}

class Zrow extends React.Component {
    render(){
	let visibleCols = filterVisibleCols(this.props.colInfos);
	
	let rowData = visibleCols.map((colInfo) => {
	    if("defaultContent" in colInfo){
		return [colInfo.defaultContent, klassName(colInfo)];
	    }
	    let rd =  this.props.row[colInfo.data];	    
	    if("render" in colInfo){
		return [colInfo.render(rd), klassName(colInfo)];
	    }
	    return [rd, klassName(colInfo)];
	});

	return (
	    <tr>
		{rowData.map((r) => {
		     let k = "text-center " + r[1];
		     return (<td className={k}>{r[0]}</td>);
		})}
	    </tr>);
    }
}

class Ztable extends React.Component {
    constructor(props) {
        super(props);
	this.state = {search: '',
		      pageNum: 1, // page indexes are 1-based
		      pageSize: 10};
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
        
    render(){
	const searchBoxChange = (e) => {
	    this.setState({search: e.target.value,
			   pageNum: 1});
	};

	const pageClick = (e) => {
	    this.setState({pageNum: e});
	};

	let rowIDs = this.searchFilter();

	let numPages = Math.ceil(rowIDs.length / this.state.pageSize);
	// page indexes are 1-based
	let rowStart = (this.state.pageNum - 1) * this.state.pageSize;
	let rowEnd = this.state.pageNum * this.state.pageSize;
	
	let tableKlass = "table table-bordered table-condensed table-hover";
	
	return (
	    <div style={{width: "100%"}}>
		<SearchBox value={this.state.search} onChange={searchBoxChange} />
		<table className={tableKlass}>
		    <Zheader colInfos={this.props.cols} />
		    {rowIDs.slice(rowStart, rowEnd).map((idx) => (
			 <Zrow row={this.props.data[idx]}
			       colInfos={this.props.cols} />
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
