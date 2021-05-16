/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import ScaledPlot from "./scaledplot";

const ccoords = (r) => (pct) =>
  [
    (1 + Math.sin(2 * Math.PI * pct)) * r,
    (1 - Math.cos(2 * Math.PI * pct)) * r,
  ];

class PieChart extends ScaledPlot {
  constructor(props) {
    super(props);
    this.UNSAFE_componentWillReceiveProps(props);
  }

  UNSAFE_componentWillReceiveProps(props) {
    super.UNSAFE_componentWillReceiveProps(props, [0, 0]);
    this._radius = Math.min(
      this.props.viewBox.width / 2,
      this.props.viewBox.height / 2
    );
    this._coord = ccoords(this._radius);
  }

  render() {
    let ipct = 0;
    let lentry_height =
      this.props.viewBox.height / Math.max(6, this.props.slices.length);
    return super.render(
      <g>
        {this.props.slices.map((s, i) => {
          let start = this._coord(ipct);
          ipct += s.pct;
          let end = this._coord(ipct);
          let M = "M " + start[0] + " " + start[1];
          let A =
            "A " +
            this._radius +
            " " +
            this._radius +
            " 0 " +
            (s.pct > 0.5 ? 1 : 0) +
            " 1 " +
            end[0] +
            " " +
            end[1];
          let L = "L " + this._radius + " " + this._radius;
          return (
            <path
              fill={s.fill}
              stroke={this.props.stroke}
              d={[M, A, L].join(" ")}
            />
          );
        })}
        <g transform={"translate(" + this._radius * 2.1 + ",0)"}>
          {this.props.slices.map((s, i) => (
            <g transform={"translate(0," + i * lentry_height + ")"}>
              <rect
                x={0}
                y={lentry_height * 0.1}
                width={lentry_height * 0.8}
                height={lentry_height * 0.8}
                strokeWidth={2}
                stroke="#000"
                fill={s.fill}
              />
              <text
                x={lentry_height}
                y={lentry_height * 0.6}
                fontSize={lentry_height / 2}
              >
                {s.legendkey}
              </text>
            </g>
          ))}
        </g>
      </g>
    );
  }
}
export default PieChart;
