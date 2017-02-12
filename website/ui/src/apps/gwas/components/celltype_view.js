import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import loading from '../../../common/components/loading'

class Table2 extends React.Component {

    headerCell(c){ return (<th>{c}</th>); }

    cell(c){ return (<td>{c}</td>); }


    headerRow(rd){
	return (<tr>
		{rd.map((c) => { return this.headerCell(c); })}
		</tr>);
    }

    row(rd, props){
	return (<tr>
		{rd.map((c) => { return this.cell(c); })}
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

               </div>);
    }
}

class CelltypeView extends React.Component {
    render() {
        let d = this.props.data[this.props.cellType.ct];
	return (<div>
                <h3>{this.props.cellType.view}</h3>

                <Table2 rows={d.accessions} header={d.header}/>
		</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(CelltypeView);
