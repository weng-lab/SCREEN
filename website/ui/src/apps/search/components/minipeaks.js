var React = require('react')
import {connect} from 'react-redux'

import REComponent from '../../../common/components/re_component'

const ROWHEIGHT = 30.0;
const ROWMARGIN = 15;
const COLMARGIN = 10;
const LEFTMARGIN = 450;
const TOPMARGIN = 100;
const TOPANGLED = 60.0;
const TOPANGLE = TOPANGLED * Math.PI / 180.0;

class MiniPeaks extends REComponent {

    constructor(props) {
	super(props);
	this._render_histogram = this._render_histogram.bind(this);
	this._render_regionset = this._render_regionset.bind(this);
    }

    _render_histogram(values, height, transform, color) {
	return (<g transform={transform} width={values.length} height={height}>
		   {values.map((v, i) => (<rect width="1" height={v} y={height - v} x={i} fill={color} />))}
		</g>);
    }

    _render_regionset(regions, width, order, transform, text, mfactor) {
	var _render_histogram = this._render_histogram;
	return (<g transform={transform} width={width} height={ROWHEIGHT}>
		   <text transform={"translate(" + (LEFTMARGIN - 20) + ",25)"} textAnchor="end">{text}</text>
		   <g transform={"translate(" + LEFTMARGIN + ",0)"}>
		      {order.map((k, i) => (
		          _render_histogram(regions[k].map((d) => (d * mfactor)), ROWHEIGHT, "translate(" + ((width + COLMARGIN) * i) + ",0)", "#000")
		      ))}
		   </g>
		</g>);
    }

    _putfirst(regions, acc) {
	var retval = [];
	Object.keys(regions).map((k) => {if (k == acc) retval[0] = regions[k]});
	Object.keys(regions).map((k) => {if (k != acc) retval.push(regions[k])});
	return retval;
    }
    
    render() {

	// make sure regions are present, count values
	if (!this.props.regions || Object.keys(this.props.regions).length == 0) return <div />;
	var cts = Object.keys(this.props.regions);
	var elems = Object.keys(this.props.regions[cts[0]]);
	var regions = this.props.regions;
	if (elems.length == 0) return <g />;
	var nbars = regions[cts[0]][elems[0]].length;
	var _render_regionset = this._render_regionset;
	if (this.props.firstacc) elems = this._putfirst(elems, this.props.firstacc);
	var mfactor = ROWHEIGHT / Math.max(...(Object.keys(regions).map((k) => {
	    var _regions = regions[k];
	    return Math.max(...(Object.keys(_regions).map((_k) => (Math.max(..._regions[_k])))));
	})));
	
	// get dimensions, render
	var width = (nbars + COLMARGIN) * elems.length + LEFTMARGIN;
	var height = (ROWHEIGHT + ROWMARGIN) * cts.length + TOPMARGIN;
	return (<svg width={width} height={height}>
		   <g transform={"translate(0," + TOPMARGIN + ")"}>
		   <g width={width - LEFTMARGIN} height={TOPMARGIN} transform="translate(450,0)">
		      {elems.map((e, i) => {
		         var _x = (nbars + COLMARGIN) * i + (nbars / 2);
		         return <text textAnchor="start" x={_x * Math.cos(TOPANGLE)} y={_x * Math.sin(TOPANGLE)} transform={"rotate(-" + TOPANGLED + ")"}>{e}</text>;
		      })}
		   </g>
		   {Object.keys(regions).map((k, i) => (
		       _render_regionset(regions[k], nbars, elems, "translate(0," + ((ROWHEIGHT + ROWMARGIN) * i) + ")", k, mfactor)
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
	regions: state,
	firstacc: _state.re_detail.q.accession
    };
};

export const minipeaks_connector = (pf) => connect(props_map(pf));
