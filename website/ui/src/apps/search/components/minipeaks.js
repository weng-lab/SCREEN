import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import REComponent from '../../../common/components/re_component'

import * as Actions from '../actions/main_actions';

import {TissueColors, primary_cell_color, tissue_color, friendly_celltype, tissue_name, infer_primary_type} from '../config/colors'

const ROWHEIGHT = 30.0;
const ROWMARGIN = 15;
const COLMARGIN = 10;
const LEFTMARGIN = 450;
const TOPMARGIN = 100;
const TOPANGLED = 60.0;
const TOPANGLE = TOPANGLED * Math.PI / 180.0;

const _tissuecolor = (t) => (TissueColors[t] ? TissueColors[t] : "#000000");

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
	this.state = {
	    "assay": "dnase"
	};
	this._onchange = this._onchange.bind(this);
	this._colors = {
	    "dnase": "#06DA93",
	    "h3k4me3": "#FF0000",
	    "h3k27ac": "#1262EB"
	};
    }

    _render_histogram(values, height, transform, color) {
	return (<g transform={transform} width={values.length} height={height}>
		   {values.map((v, i) => (<rect width="1" height={v} y={height - v} x={i} fill={color} />))}
		</g>);
    }

    _onchange() {
	this.setState({"assay": this.refs.assay.value});
	if (this.props.onAssayChange) this.props.onAssayChange(this.refs.assay.value);
    }

    _render_regionset(regions, width, order, transform, text) {
	let assay = (this.props.assay ? this.props.assay : this.state.assay);
	var _render_histogram = this._render_histogram;
	var _max = assay != "dnase" ? 50.0 : 150.0;
	var mfactor = ROWHEIGHT / _max;
	text = friendly_celltype(text);

	return (<g transform={transform} width={width} height={ROWHEIGHT}>
		   <text transform={"translate(" + (LEFTMARGIN - 20) + ",25)"} textAnchor="end" fill={_tissuecolor(regions["tissue"])}>{text}</text>
		   <g transform={"translate(" + LEFTMARGIN + ",0)"}>
		      {order.map((k, i) => (
		          regions[k] ? _render_histogram(regions[k].map((d) => ((d > _max ? _max : d) * mfactor)), ROWHEIGHT, "translate(" + ((width + COLMARGIN) * i) + ",0)", this._colors[assay]) : <g />
		      ))}
		   </g>
		</g>);
    }

    render() {
	var row = this.props.data.regions[0];
	var dataByFileID = row.data;
	var nbars = 20;
	var assay = 'dnase';
	var mmax = assay != "dnase" ? 50.0 : 150.0;
	var mfactor = ROWHEIGHT / mmax;

	var histograms = Object.keys(dataByFileID).map((fileID) => {
	    let data = dataByFileID[fileID];
	    data = data.map((d) => ((d > mmax ? mmax : d) * mfactor));
	    return (<tr>
		    <td>
		    {fileID}
		    </td>
		    <td>
		    <svg width={data.length} height={ROWHEIGHT} >
		    <g>
		    {data.map((v, i) => (<rect width="1" height={v}
					 y={ROWHEIGHT - v} x={i}
					 fill={"blue"} />)
			     )}
		    </g>
		    </svg>
		    </td>
		    </tr>);
	});
	
	return (<div>
		<select ref="assay" onChange={this._onchange}>
		<option value="dnase" selected={this.props.assay && this.props.assay == "dnase"}>DNase</option>
		<option value="h3k4me3" selected={this.props.assay && this.props.assay == "h3k4me3"}>H3K4me3</option>
		<option value="h3k27ac" selected={this.props.assay && this.props.assay == "h3k27ac"}>H3K27ac</option>
		</select><br />

		<table>
		{histograms}
		</table>
		
		</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(MiniPeaks);
