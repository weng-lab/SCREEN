import React from 'react';

const filterVisibleCols = (cols) => (
    cols.filter((c) => {
	if("visible" in c){
	    return c["visible"];
	}
	return true;
    })
)

class Zheader extends React.Component {
    render(){
	let visibleCols = filterVisibleCols(this.props.colInfos);
	
	let rowData = visibleCols.map((colInfo) => (
	    colInfo.title
	));
	
	return (
	    <tr>
		{rowData.map((r) => (<th>{r}</th>))}
	    </tr>);
    }
}

class Zrow extends React.Component {
    render(){
	let visibleCols = filterVisibleCols(this.props.colInfos);
	
	let rowData = visibleCols.map((colInfo) => {
	    if("defaultContent" in colInfo){
		return colInfo["defaultContent"];
	    }
	    let rd =  this.props.row[colInfo.data];	    
	    if("render" in colInfo){
		return colInfo["render"](rd);
	    }
	    return rd;
	});

	return (
	    <tr>
		{rowData.map((r) => (<td>{r}</td>))}
	    </tr>);
    }
}

class Ztable extends React.Component {
    constructor(props) {
	super(props);
    }

    filter(rows){
	return rows.map((row, idx) => {
	    return idx;
	});
    }
    
    render(){
	let rows = this.props.data;
	let colInfos = this.props.cols;

	let rowIDs = this.filter(rows);

	return (
	    <div style={{width: "100%"}}>
		<table className={"table table-bordered table-condensed table-hover"}>
		    <Zheader colInfos={colInfos}
		    />
		    {rowIDs.slice(0,10).map((idx) => (
			 <Zrow row={rows[idx]}
			       colInfos={colInfos}
			 />
		     ))}
		</table>
	    </div>);
    }
}

export default Ztable;
