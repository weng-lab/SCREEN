import React from 'react';

import { Form, FormGroup, FormControl, Nav } from 'react-bootstrap';

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

class Zrows {

}

class Ztable extends React.Component {
    constructor(props) {
        super(props);
	this.state = {search: '',
		      pageNum: 0,
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
	    this.setState({search: e.target.value});
	};

	let rowIDs = this.searchFilter();
	let rowStart = this.state.pageNum * this.state.pageSize;
	let rowEnd = (this.state.pageNum + 1) * this.state.pageSize;
	
	return (
	    <div style={{width: "100%"}}>
		<SearchBox value={this.state.search} onChange={searchBoxChange} />
		<table className={"table table-bordered table-condensed table-hover"}>
		    <Zheader colInfos={this.props.cols} />
		    {rowIDs.slice(rowStart, rowEnd).map((idx) => (
			 <Zrow row={this.props.data[idx]} colInfos={this.props.cols} />
		    ))}
		</table>
	    </div>);
    }
}

export default Ztable;
