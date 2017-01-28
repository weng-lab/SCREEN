import React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import REComponent from '../../../common/components/re_component'

import LargeHorizontalBars from '../components/large_horizontal_bars'

class ExpressionBoxplot extends React.Component {
    componentDidMount() {
	this.componentDidUpdate();
    }

    componentDidUpdate() {
	var width = 800;
	var barheight = "15";
	render(React.createElement(LargeHorizontalBars,
                                   {...this.props.data, width, barheight}),
	       this.refs.bargraph);
    }

    render() {
	return (<div>
 	        <span style={{fontSize: "18pt"}}>
                {this.props.gene} <span ref="help_icon" />
                </span>
		<div style={{"width": "100%"}} ref="bargraph" />
		</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(ExpressionBoxplot);
