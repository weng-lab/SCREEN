/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import WrappedText from "./wrappedtext";
import ScaledPlot from "./scaledplot";

const XAXIS = 50;
const YAXIS = 60;
const text_format = (x) => Math.round(x * 100) / 100.0;

class Boxplot extends ScaledPlot {
  constructor(props) {
    super(props);
    this.UNSAFE_componentWillReceiveProps(props);
  }

  UNSAFE_componentWillReceiveProps(props) {
    super.UNSAFE_componentWillReceiveProps(props, [XAXIS, YAXIS]);
    this._qsetorder = props.qsetorder
      ? props.qsetorder
      : Object.keys(props.qsets);
    this._range = [
      Math.min(
        ...this._qsetorder
          .filter((k) => k !== "")
          .map((k) => props.qsets[k].values[0])
      ),
      Math.max(
        ...this._qsetorder
          .filter((k) => k !== "")
          .map((k) => props.qsets[k].values[4])
      ) * 1.1,
    ];
    if (this.props.range) this._range = this.props.range;
    this._xscale = this._viewsize[0] / this._qsetorder.length;
    this._yscale = this._viewsize[1] / (this._range[1] - this._range[0]);
    this._boxwidth = this._viewsize[0] / this._qsetorder.length;
    this._x = (x) => x * this._xscale + this._boxwidth * 0.15 + XAXIS;
    this._y = (y) => (-y + this._range[1]) * this._yscale;
  }

  render() {
    let xaxis = (
      <g>
        <text
          x={XAXIS * 0.75}
          width={XAXIS * 0.75}
          style={{ textAnchor: "end" }}
          fontSize={(2 * this.props.viewBox.width) / 100}
          y={this._y(text_format(this._range[0]))}
        >
          {text_format(this._range[0])}
        </text>
        <text
          x={XAXIS * 0.75}
          width={XAXIS * 0.75}
          style={{ textAnchor: "end" }}
          fontSize={(2 * this.props.viewBox.width) / 100}
          y={this._y(text_format(this._range[1] / 3))}
        >
          {text_format(this._range[1] / 3)}
        </text>
        <text
          x={XAXIS * 0.75}
          width={XAXIS * 0.75}
          style={{ textAnchor: "end" }}
          fontSize={(2 * this.props.viewBox.width) / 100}
          y={this._y(text_format((this._range[1] * 2) / 3))}
        >
          {text_format((this._range[1] * 2) / 3)}
        </text>
        <text
          x={XAXIS * 0.75}
          width={XAXIS * 0.75}
          style={{ textAnchor: "end" }}
          fontSize={(2 * this.props.viewBox.width) / 100}
          y={this._y(text_format(this._range[1] / 1.1))}
        >
          {text_format(this._range[1] / 1.1)}
        </text>
      </g>
    );
    let _box = (k, _q, i) => {
      if (k === "" || !_q) return null;
      let q = _q.values;
      let whiskers = [
        this.props.useiqr
          ? Math.min(1.5 * (q[3] - q[1]), q[1] - q[0])
          : q[1] - q[0],
        this.props.useiqr
          ? Math.min(1.5 * (q[3] - q[1]), q[4] - q[3])
          : q[4] - q[3],
      ];
      let outliers =
        !_q.outliers || this.props.hideoutliers
          ? null
          : _q.outliers.map((o) => (
              <circle
                fill="#fff"
                stroke="#000"
                r={2}
                strokeWidth={1}
                cx={this._boxwidth * 0.35}
                cy={this._y(o)}
              />
            ));
      return (
        <g transform={"translate(" + this._x(i) + ",0)"}>
          <rect
            width={this._boxwidth * 0.7}
            height={this._yscale * (q[2] - q[1])}
            x={0}
            y={this._y(q[2])}
            strokeWidth={1}
            fill="#fff"
            stroke="#000"
          />
          <rect
            width={this._boxwidth * 0.7}
            height={this._yscale * (q[3] - q[2])}
            x={0}
            y={this._y(q[3])}
            strokeWidth={1}
            fill="#fff"
            stroke="#000"
          />
          <rect
            width={1}
            height={this._yscale * whiskers[1]}
            x={this._boxwidth * 0.35}
            y={this._y(q[3] + whiskers[1])}
          />
          <rect
            width={1}
            height={this._yscale * whiskers[0]}
            x={this._boxwidth * 0.35}
            y={this._y(q[1])}
          />
          <rect
            width={this._boxwidth * 0.6}
            height={1}
            x={this._boxwidth * 0.05}
            y={this._y(q[1] - whiskers[0])}
          />
          <rect
            width={this._boxwidth * 0.6}
            height={1}
            x={this._boxwidth * 0.05}
            y={this._y(q[3] + whiskers[1])}
          />
          {outliers}
          <g transform={"translate(0," + this._y(this._range[0]) + ")"}>
            <WrappedText
              width={this._boxwidth * 0.7}
              height={YAXIS}
              text={k}
              style={{
                fontSize:
                  this.props.viewBox.width / 5 / this._qsetorder.length + "px",
                textAlign: "center",
              }}
            />
          </g>
        </g>
      );
    };
    return super.render(
      <g>
        {xaxis}
        {this._qsetorder.map((k, i) => _box(k, this.props.qsets[k], i))}
      </g>
    );
  }
}
export default Boxplot;
