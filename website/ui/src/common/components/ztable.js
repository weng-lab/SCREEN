import React from 'react';

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
