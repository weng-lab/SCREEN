import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import REComponent from '../../../common/components/re_component'

import * as Actions from '../actions/main_actions';

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
	var regions = this.props.data.regions;
        var elems = this.props.data.mostSimilar;
        console.log(elems)

	var cts = Object.keys(regions);
	cts.sort((a, b) => (ctindex(a) - ctindex(b)));
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
}

const mapStateToProps = (state) => ({
        ...state
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MiniPeaks);
