import React from 'react'

class Table extends React.Component {

    headerCell(c){ return (<th>{c}</th>); }

    headerRow(rd){
	return (<tr>
		{rd.map((c) => { return this.headerCell(c); })}
		</tr>);
    }

    row(rd, props){
	return (<tr>
                <td onClick={() => {
                    var ct = {"view" : rd[0], "ct" : rd[2]};
                    props.actions.setCellType(ct);
                }} >
                {rd[0]}
                </td>
                <td>{rd[1]}</td>
		</tr>);
    }

    render() {
	return (<div>

                <table className="table table-bordered">
		<thead>
		{this.headerRow(this.props.header)}
		</thead>
		<tbody>
		{this.props.rows.map((rd) => {
		    return this.row(rd, this.props);
		})}
		</tbody>
		</table>

                <small>
                {"Click on a cell type for more information"}
                </small>

               </div>);
    }
}

export default Table;
