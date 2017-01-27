import React from 'react'

class Table extends React.Component {
    cell(c){
	return (<td>
		{c}
		</td>);
    }
    
    row(rd){
	return (<tr>
		{rd.map((c) => {
		    return this.cell(c);
		})}
		</tr>);
    }
    
    render() {
	return (<table>
		{this.props.data.map((rd) => {
		    return this.row(rd);
		})}
		</table>);
    }
}

export default Table;
