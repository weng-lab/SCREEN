import React from 'react';
import ScaledPlot from './scaledplot';

export const compute_offsets = (sorted_keys, itemsets, value) => {
    let total_items = 0; let cmax = 0;
    let labeloffsets = []; let yoffsets = {};
    sorted_keys.map((k) => {
	yoffsets[k] = total_items;
	labeloffsets.push(total_items + (
 	    itemsets[k].items.length / 2.0
	) + 0.25);
	total_items += itemsets[k].items.length;
	var d = Math.max(...itemsets[k].items.map(value));
	if (d > cmax) cmax = d;
    });
    return {
	total: total_items,
	max: cmax,
	labeloffsets,
	yoffsets
    };
};

class HorizontalBar extends ScaledPlot {

    constructor(props) {
	super(props);
	this.componentWillReceiveProps(props);
    }

    componentWillReceiveProps(props) {
	super.componentWillReceiveProps(props, props.axis_offsets);
	let t0 = x => x > 0 ? x : 0;
	this._format = props.format.value ? props.format.value : x => x;
	this._label = props.format.label ? props.format.label : x => "";
	this._grouplabel = props.format.grouplabel ? props.format.grouplabel : x => "";
	this._value = d => t0(this._format(d));

	// compute bar and label offsets
	this._sorted_keys = Object.keys(props.itemsets).sort(
	    (a, b) => (a.toLowerCase().localeCompare(b.toLowerCase()))
	);
	this._item_distribution = compute_offsets(this._sorted_keys, props.itemsets, this._value);

	// for coordinate conversion
	this._xscale = this._viewsize[0] / this._item_distribution.max;
	this._x = x => x * this._xscale + props.axis_offsets[0] / 2.0;
	this._barheight = this._viewsize[1] / (this._item_distribution.total + 1);
	this._y = y => y * this._barheight;
    }

    render() {
	
	// prepare formatting functions
	let fontsize = this._barheight * 0.75;

	// elements for rendering
	let yaxis = (
		<g transform={"translate(" + (this.props.axis_offsets[0] * 0.5) + ",0)"}>
	            <path className="domain" d={"M-2,0H0V" + this._viewsize[1] + "H-2"} />
		</g>
	);
	let bars = (this._sorted_keys.map((key, k) => (
	    this.props.itemsets[key].items.map((item, i) => (
		<g transform={"translate(" + (this.props.axis_offsets[0] * 0.5) + "," + this._y(this._item_distribution.yoffsets[key]) + ")"}>
		    <rect height={this._barheight} x="0" y={this._y(i)} strokeWidth="1" stroke="white"
		      width={this._value(item) * this._xscale} style={{fill: this.props.itemsets[key].color}} />
	            <text x={this._value(item) * this._xscale + 5} y={this._y(i) + fontsize}
		      style={{fill: "#000", fontSize: fontsize + "px"}}>
		        {this._value(item) + " " + this._label(item)}
		    </text>
		</g>
	    ))
	)));
	let leftlabels = (this._sorted_keys.map((key, k) => (
	    <text x={this.props.axis_offsets[0] * 0.45} y={this._y(this._item_distribution.labeloffsets[k])}
	      style={{fill: "000", fontSize: this._barheight + "px", textAnchor: "end"}}>
		{this._grouplabel(this.props.itemsets[key])}
	    </text>
	)));
	return super.render(
	    <g>
		{yaxis}
	        {bars}
	        {leftlabels}
            </g>
	);
	
    }
    
}
export default HorizontalBar;
