import React from 'react'
import {connect} from 'react-redux';

import Heatmap from '../../../common/components/heatmap'

class ExpressionHeatmapSet extends React.Component {

    constructor(props) {
	super(props);
	this.tabClick = this.tabClick.bind(this);
	this.state = {
	    selection: 0
	};
    }

    tabClick(i) {
	this.setState({
	    selection: i
	});
    }

    render() {
	var matrices = this.props.matrices;
	var chart_layout = this.props.chart_layout;
	var selection = this.state.selection;
	var tabClick = this.tabClick;
	var tabs = Object.keys(matrices).map((k, i) => (
		<li className={i == selection ? "active" : ""} key={"tab_" + i}>
	           <a data-toggle="tab" onClick={() => {tabClick(i);}} key={"a_" + i}>{k}</a>
	        </li>
	));
	var tab_contents = Object.keys(matrices).map((k, i) => {
	    return <div className={i == selection ? "tab-pane active" : "tab-pane"} key={"tab_c" + i}>
		      <Heatmap chart_layout={chart_layout} rowlabels={matrices[k].rowlabels} title=""
	                 collabels={matrices[k].collabels} data={matrices[k].matrix} key={"heatmap_c" + i} />
		   </div>;
	});
	return (<div id="exTab1" className="container">
		   <ul className="nav nav-tabs">{tabs}</ul>
		   <div className="tab-content clearfix">{tab_contents}</div>
		</div>);
    }

};
export default ExpressionHeatmapSet;

const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	chart_layout: state.chart_layout,
	matrices: state.matrices,
	loading: state.loading
    };
};

export const expression_heatmap_connector = (pf) => connect(props_map(pf));
