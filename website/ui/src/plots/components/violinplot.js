import React from 'react';
import WrappedText from './wrappedtext'
import ScaledPlot from './scaledplot';

const XAXIS = 150;
const YAXIS = 60;
const text_format = x => Math.round(x * 100) / 100.0;

class ViolinPlot extends ScaledPlot {

    constructor(props) {
	super(props);
	this.componentWillReceiveProps(props);
    }

    componentWillReceiveProps(props) {
	super.componentWillReceiveProps(props, [XAXIS, YAXIS]);
	this._qsetorder = (props.qsetorder ? props.qsetorder : Object.keys(props.qsets));
	if (!this.props.range) {
	    this._range = [Math.min(...this._qsetorder.filter(k => k !== "").map(k => props.qsets[k].domain[0])),
			   Math.max(...this._qsetorder.filter(k => k !== "").map(k => props.qsets[k].domain[1])) * 1.1];
	} else {
	    this._range = this.props.range;
	}
	this._xscale = this._viewsize[0] / this._qsetorder.length;
	this._yscale = this._viewsize[1] / (this._range[1] - this._range[0]);
	this._boxwidth = this._viewsize[0] / this._qsetorder.length;
	this._vscale = this._boxwidth / 2 / Math.max(...this._qsetorder.filter(k => k !== "").map(k => Math.max(...props.qsets[k].values)));
	this._x = x => x * this._xscale + this._boxwidth * 0.15 + XAXIS;
	this._y = y => (-y + this._range[1]) * this._yscale;
    }
    
    _path(q, o) {
	let r = "M0 " + this._y(q.domain[0] - 1);
	q.values.map( (v, i) => {
	    r += " L" + (this._vscale * v * o) + " " + this._y(q.domain[0] + (i * +q.step));
	} );
	return r + "L0 " + this._y(q.domain[1] + 1);
    }

    render() {
	let xaxis = (
	    <g>
                <text x={XAXIS * .75} width={XAXIS * .75} style={{textAnchor: "end"}} fontSize={2 * this.props.viewBox.width / 100}
                    y={this._y(text_format(this._range[0]))}>{text_format(this._range[0])}</text>
		<text x={XAXIS * .75} width={XAXIS * .75} style={{textAnchor: "end"}} fontSize={2 * this.props.viewBox.width / 100}
                    y={this._y(text_format(this._range[1] / 3))}>{text_format(this._range[1] / 3)}</text>
		<text x={XAXIS * .75} width={XAXIS * .75} style={{textAnchor: "end"}} fontSize={2 * this.props.viewBox.width / 100}
                    y={this._y(text_format(this._range[1] * 2 / 3))}>{text_format(this._range[1] * 2 / 3)}</text>
		<text x={XAXIS * .75} width={XAXIS * .75} style={{textAnchor: "end"}} fontSize={2 * this.props.viewBox.width / 100}
                    y={this._y(text_format(this._range[1] / 1.1))}>{text_format(this._range[1] / 1.1)}</text>		
	    </g>
	);
	let _box = (k, _q, i) => {
	    if (k === "" || !_q) return null;
	    
	    return (
		<g transform={"translate(" + (this._x(i) + this._boxwidth / 2) + ",0)"}>
		    <path d={this._path(_q, -1)} stroke="#000" strokeWidth="2" />
		    <path d={this._path(_q, 1)} stroke="#000" strokeWidth="2" />
		    <g transform={"translate(" + (-this._boxwidth / 2) + "," + this._y(this._range[0]) + ")"}>
		        <WrappedText width={this._boxwidth * 0.7} height={YAXIS} text={k}
		            style={{fontSize: this.props.viewBox.width / 5 / this._qsetorder.length + "px", textAlign: "center"}} />
	            </g>
		</g>
	    );
	};
	return super.render(
	    <g>
		{xaxis}
                {this._qsetorder.map( (k, i) => _box(k, this.props.qsets[k], i) )}
	    </g>
	);
    }

}
export default ViolinPlot;
