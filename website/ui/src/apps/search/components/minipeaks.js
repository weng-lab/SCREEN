var React = require('react')
import {connect} from 'react-redux'

import REComponent from '../../../common/components/re_component'

const ROWHEIGHT = 30;
const ROWMARGIN = 15;
const COLMARGIN = 10;
const LEFTMARGIN = 300;
const TOPMARGIN = 100;

class MiniPeaks extends REComponent {

    constructor(props) {
	super(props);
    }

    _render_histogram(values, height, transform, color) {
	return (<g transform={transform} width={values.length} height={height}>
		   {values.map((v, i) => (<rect width="1" height={v} y={height - v} x={i} fill={color} />))}
		</g>);
    }

    _render_regionset(regions, width, order, transform, text) {
	var _render_histogram = this._render_histogram;
	return (<g transform={transform} width={width} height={ROWHEIGHT}>
		   <text>{text}</text>
		   <g transform={"translate(" + LEFTMARGIN + ",0)"}>
		      {order.map((k, i) => (
		          _render_histogram(regions[k], ROWHEIGHT, "translate(" + ((width + COLMARGIN) * i) + ",0)", "#000")
		      ))}
		   </g>
		</g>);
    }
    
    render() {

	// make sure regions are present, count values
	if (!this.props.regions || Object.keys(this.props.regions).length == 0) return <div />;
	var cts = Object.keys(this.props.regions);
	var elems = Object.keys(this.props.regions[cts[0]]);
	if (elems.length == 0) return <g />;
	var nbars = regions[elems[0]].length;
	var _render_regionset = this._render_regionset;
	var regions = this.props.regions;
	
	// get dimensions, render
	var width = (nbars + COLMARGIN) * elems.length + LEFTMARGIN;
	var hegiht = (ROWHEIGHT + ROWMARGIN) * cts.length + TOPMARGIN;
	return (<svg width={width} height={height}>
		   <g transform={"translate(0," + TOPMARGIN + ")"}>
		   {Object.keys(regions).map((k, i) => (
		         _render_regionset(regions[k], nbars, elems, "translate(0," + ((ROWHEIGHT + ROWMARGIN) * i) + ")", k)
		   ))}
	           </g>
		</svg>);
	
    }

    componentDidUpdate() {
	super.componentDidUpdate();
    }

    componentDidMount() {
	super.componentDidMount();
    }
    
}
export default MiniPeaks;

export const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	regions: state
    };
};

export const minipeaks_connector = (pf) => connect(props_map(pf));
