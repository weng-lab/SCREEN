import React from 'react'

class Table extends React.Component {
    constructor(props, key) {
	super(props);
        this.open = this.open.bind(this);
    }

    open(ct){
        console.log("hi", ct);
    }

    headerCell(c){ return (<th>{c}</th>); }

    headerRow(rd){
	return (<tr>
		{rd.map((c) => { return this.headerCell(c); })}
		</tr>);
    }

    row(rd){
	return (<tr>
                <td onClick={() => {this.open(rd[0])}}>
                {rd[0]}
                </td>
                <td>{rd[1]}</td>
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
