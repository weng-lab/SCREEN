var React = require('react')
import {connect} from 'react-redux'

import REComponent from '../../../common/components/re_component'

import {primary_cell_color, tissue_color, friendly_celltype, tissue_name, infer_primary_type} from '../config/colors'

const ROWHEIGHT = 30.0;
const ROWMARGIN = 15;
const COLMARGIN = 10;
const LEFTMARGIN = 450;
const TOPMARGIN = 100;
const TOPANGLED = 60.0;
const TOPANGLE = TOPANGLED * Math.PI / 180.0;

const ctindex = (d) => {
    var t = tissue_name(d);
    if (d.includes("primary_cell")) {
	t = infer_primary_type(d, tissue_name(d));
	return 1000 + t.charCodeAt(0) + t.charCodeAt(1) + t.charCodeAt(2);
    } else if (d.includes("tissue")) {
	return 2000 + d.charCodeAt(0) + d.charCodeAt(1) + d.charCodeAt(2);
    }
    return 3000 + d.charCodeAt(0) + d.charCodeAt(1) + d.charCodeAt(2);
}

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

    _render_regionset(regions, width, order, transform, text) {
	var _render_histogram = this._render_histogram;
	var mfactor = (regions.max
		       ? ROWHEIGHT / regions.max
		       : ROWHEIGHT / Math.max(...(Object.keys(regions).map((_k) => (Math.max(...regions[_k]))))));
	text = friendly_celltype(text);
	var color = (text.includes("primary cell") ? primary_cell_color(text) : tissue_color(text));
	return (<g transform={transform} width={width} height={ROWHEIGHT}>
		   <text transform={"translate(" + (LEFTMARGIN - 20) + ",25)"} textAnchor="end">{text}</text>
		   <g transform={"translate(" + LEFTMARGIN + ",0)"}>
		      {order.map((k, i) => (
		          regions[k] ? _render_histogram(regions[k].map((d) => (d * mfactor)), ROWHEIGHT, "translate(" + ((width + COLMARGIN) * i) + ",0)", color) : <g />
		      ))}
		   </g>
		</g>);
    }
    
    render() {

	// make sure regions are present, count values
	if (!this.props.regions || Object.keys(this.props.regions).length == 0) return <div />;
	var cts = Object.keys(this.props.regions);
	cts.sort((a, b) => (ctindex(a) - ctindex(b)));
	var elems = (this.props.accorder ? this.props.accorder : Object.keys(this.props.regions[cts[0]]));
	var regions = this.props.regions;
	if (elems.length == 0) return <g />;
	var nbars = regions[cts[0]][elems[0]].length;
	var _render_regionset = this._render_regionset;
	
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
		   {cts.map((k, i) => (
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
	regions: state,
	accorder: _state.re_detail.data.most_similar
    };
};

export const minipeaks_connector = (pf) => connect(props_map(pf));
