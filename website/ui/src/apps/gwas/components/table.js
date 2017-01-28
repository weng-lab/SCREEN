import React from 'react'

class Table extends React.Component {
    cell(c){ return (<td>{c}</td>); }

    headerCell(c){ return (<th>{c}</th>); }

    headerRow(rd){
	return (<tr>
		{rd.map((c) => { return this.headerCell(c); })}
		</tr>);
    }

    row(rd){
	return (<tr>
		{rd.map((c) => { return this.cell(c); })}
		</tr>);
    }
    
    render() {
	return (<table className="table table-bordered">
		<thead>
		{this.headerRow(this.props.header)}
		</thead>
		<tbody>
		{this.props.rows.map((rd) => {
		    return this.row(rd);
		})}
		</tbody>
		</table>);
    }
}

export default Table;
