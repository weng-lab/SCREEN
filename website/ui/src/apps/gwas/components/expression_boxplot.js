import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import LargeHorizontalBars from './large_horizontal_bars'

import REComponent from '../../../common/components/re_component'

class ExpressionBoxplot extends REComponent {
    render() {
	return super.render(<div>
 	                       <span style={{fontSize: "18pt"}}>{this.props.gene_name} <span ref="help_icon" /></span>
		               <div style={{"width": "100%"}} ref="bargraph" />
		            </div>);
    }

    componentDidMount() {
	super.componentDidMount();
	this.componentDidUpdate();
    }

    componentDidUpdate() {
	super.componentDidUpdate();

	var width = 800;
	var barheight = "15";
	render(<LargeHorizontalBars width={width} items={this.props.items}
	       loading={this.props.loading} barheight={barheight} />,
	       this.refs.bargraph);
    }
}

export default ExpressionBoxplot;
