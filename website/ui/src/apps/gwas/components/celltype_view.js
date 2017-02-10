import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import HugeBars from '../components/huge_bars'
import loading from '../../../common/components/loading'

class CelltypeView extends React.Component {
    render() {
	return (<div>
                <h3>{this.props.cellType.view}</h3>
		</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(CelltypeView);
