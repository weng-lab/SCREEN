import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import HugeBars from '../components/huge_bars'
import loading from '../../../common/components/loading'

class Table2 extends React.Component {

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

class CelltypeView extends React.Component {
    render() {
        let d = this.props.data[this.props.cellType.ct];
        console.log(d);
	return (<div>
                <h3>{this.props.cellType.view}</h3>
		<HugeBars data={d.bar} />


		</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(CelltypeView);
