var React = require('react');

import ScaledPlot from './scaledplot';

const XAXIS = 30;
const YAXIS = 10;

const text_format = t => Math.round(t * 100.0) / 100.0;

class Histogram extends ScaledPlot {

    constructor(props) {
	super(props);
	this.componentWillReceiveProps(props);
    }

    componentWillReceiveProps(props) {
	super.componentWillReceiveProps(props, [XAXIS, YAXIS]);
	this._domain = [Math.min(...props.x), Math.max(...props.x) + (props.x[1] - props.x[0])];
	this._range = [0, Math.max(...props.y) * 1.1];
	let xscale = this._viewsize[0] / (this._domain[1] - this._domain[0]);
	let yscale = this._viewsize[1] / (this._range[1] - this._range[0]);
	this._x = x => (x + this._domain[0]) * xscale + props.margin.left + XAXIS;
	this._y = y => (-y + this._range[1]) * yscale + props.margin.top;
	this._barwidth = this._viewsize[0] / props.x.length;
    }
    
    render() {
	let xaxis = (
	    <g>
		<rect x={this._x(this._domain[0])} y={this._y(this._range[1])} stroke="#000"
	            height={this._y(this._range[1])} width={2} />
                <text x={XAXIS} width={XAXIS} style={{textAnchor: "end"}} fontSize="6"
                    y={this._y(this._range[0]) + 5}>{text_format(this._range[0])}</text>
                <text x={XAXIS} width={XAXIS} style={{textAnchor: "end"}} fontSize="6"
	            y={this._y(this._range[1] / 1.1) + 5}>{text_format(this._range[1] / 1.1)}</text>
	    </g>
	);
	let yaxis = (
	    <g>
		<rect x={this._x(this._domain[0])} y={this._y(0)} stroke="#000"
                    height={1} width={this._barwidth * this.props.x.length} />
                <text x={this._x(this._domain[0])} y={this._y(0) + 10} fontSize="6"
                    height={YAXIS}>{text_format(this._domain[0])}</text>
                <text x={this._x(this._domain[1])} y={this._y(0) + 10} fontSize="6"
                    height={YAXIS}>{text_format(this._domain[1])}</text>
	    </g>
	);
	return super.render(
	    <g>
		{xaxis} {yaxis}
                {this.props.x.map( (x, i) => (
                    <rect width={this._barwidth} y={this._y(this.props.y[i])}
                        height={this._y(0) - this._y(this.props.y[i])} x={this._x(x)} />
		) )}
	    </g>
	);
    }

}
export default Histogram;
