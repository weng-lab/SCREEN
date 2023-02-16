/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react"

import ScaledPlot from "./scaledplot"

const XAXIS = 50
const YAXIS = 50

const text_format = (t) => Math.round(t * 100.0) / 100.0

class Histogram extends ScaledPlot {
  constructor(props) {
    super(props)
    this.UNSAFE_componentWillReceiveProps(props)
  }

  UNSAFE_componentWillReceiveProps(props) {
    super.UNSAFE_componentWillReceiveProps(props, [XAXIS, YAXIS])
    this._domain = [Math.min(...props.x), Math.max(...props.x) + (props.x[1] - props.x[0])]
    this._range = [0, Math.max(...props.y) * 1.1]
    let xscale = (this._viewsize[0] * 0.95) / (this._domain[1] - this._domain[0])
    let yscale = this._viewsize[1] / (this._range[1] - this._range[0])
    this._x = (x) => (x + this._domain[0]) * xscale + XAXIS
    this._y = (y) => (-y + this._range[1]) * yscale
    this._barwidth = this._viewsize[0] / props.x.length
    this._ticklimit = this.props.ticklimit ? this.props.ticklimit : 2
  }

  render() {
    let xticks = [],
      yticks = []
    for (let i = 0; i <= this._ticklimit; ++i) {
      let y = text_format((this._range[1] * i) / this._ticklimit)
      let x = text_format((this._domain[1] * i) / this._ticklimit)
      xticks.push(
        <text x={XAXIS * 0.7} width={XAXIS * 0.7} style={{ textAnchor: "end" }} fontSize="6" y={this._y(y) + 3}>
          {y}
        </text>
      )
      xticks.push(<rect height={1} width={XAXIS * 0.2} x={XAXIS * 0.8} y={this._y(y)} />)
      yticks.push(
        <text x={this._x(x)} width={1} height={YAXIS * 0.9} fontSize="6" y={this._y(0) + YAXIS * 0.2 + 3}>
          {x}
        </text>
      )
      yticks.push(<rect height={YAXIS * 0.15} width={1} x={this._x(x)} y={this._y(0)} />)
    }
    let xaxis = (
      <g>
        <rect x={this._x(this._domain[0])} y={this._y(this._range[1])} stroke="#000" height={this._viewsize[1]} width={1} />
        {xticks}
      </g>
    )
    let yaxis = (
      <g>
        <rect x={this._x(this._domain[0])} y={this._y(0)} stroke="#000" height={1} width={this._barwidth * this.props.x.length} />
        {yticks}
      </g>
    )
    return super.render(
      <g>
        {xaxis} {yaxis}
        {this.props.x.map((x, i) => (
          <rect width={this._barwidth} y={this._y(this.props.y[i])} height={this._y(0) - this._y(this.props.y[i])} x={this._x(x)} />
        ))}
      </g>
    )
  }
}
export default Histogram
