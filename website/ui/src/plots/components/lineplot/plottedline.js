/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';

const SQUARE = 'SQUARE';
const CIRCLE = 'CIRCLE';

const Point = ({ color, style, weight, x, y }) => {
    if (0 === weight) { return null; }
    switch (style) {
    case SQUARE:
	return <rect x={x} y={y}
	         width={weight} height={weight} fill={color} />;
    case CIRCLE:
	return <circle r={weight} fill={color} cx={x} cy={y} />
    }
    return null;
};

const RLine = ({ color, weight, pa, pb }) => {
    if (0 === weight) { return null; }
    return <line {...{
	x1: pa[0], y1: pa[1], x2: pb[0], y2: pb[1],
        stroke: color, strokeWidth: weight
    }} />;
};

class PlottedLine extends React.Component {

    constructor(props) {
	super(props);
	this._domain = [Math.min(...this.props.x), Math.max(...this.props.x)];
	this._range = [Math.min(...this.props.y), Math.max(...this.props.y)];
	if (this._range[0] > this._range[1]) { this._range.reverse(); }
	this._y = y => (((1.0 - y / (this._range[1] - this._range[0])) * 100) + '%');
	this._x = x => ((x / (this._domain[1] - this._domain[0]) * 100) + '%');
    }

    _point(x, y) {
	return React.createElement(Point, {
	    ...this.props.pointStyle,
	    x: this._x(x), y: this._y(y)
	});
    }

    _line(i) {
	return <RLine color={this.props.lineStyle.color} weight={this.props.lineStyle.weight}
	         pa={[this._x(this.props.x[i - 1]), this._y(this.props.y[i - 1])]}
	         pb={[this._x(this.props.x[i]), this._y(this.props.y[i])]} />
    }
    
    render() {
	let points = this.props.x.map( (px, i) => this._point(px, this.props.y[i]) );
	let lines = this.props.x.map( (px, i) => (i === 0 ? null : this._line(i)) );
	return <g>{points}{lines}</g>;
    }

}
export default PlottedLine;
