/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react"

class Pie extends React.Component {
  componentDidMount() {
    this.componentDidUpdate()
  }

  render() {
    return (
      <div>
        <span style={{ fontSize: "18pt" }}>
          <span ref="help_icon" />
          {this.props.gwas_study}
        </span>

        <div style={{ width: "100%" }} ref="chart" />
      </div>
    )
  }

  componentDidUpdate() {
    // from http://bl.ocks.org/mbostock/3887118
    // and http://stackoverflow.com/a/30955562
    // and http://bl.ocks.org/d3noob/e34791a32a54e015f57d
    let chart = this.refs.chart
    $(chart).empty()
    let data = this.props.data

    var width = 200
    var height = 200
    var radius = Math.min(width, height) / 2

    var color = d3.scale.ordinal().range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"])

    var arc = d3.svg
      .arc()
      .outerRadius(radius - 10)
      .innerRadius(0)

    var labelArc = d3.svg
      .arc()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40)

    var pie = d3.layout
      .pie()
      .sort(null)
      .value(function (d) {
        return d[1]
      })

    var svg = d3
      .select(chart)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

    var g = svg.selectAll(".arc").data(pie(data)).enter().append("g").attr("class", "arc")

    g.append("path")
      .attr("d", arc)
      .style("fill", function (d) {
        return color(d.data[0])
      })

    g.append("text")
      .attr("transform", function (d) {
        return "translate(" + labelArc.centroid(d) + ")"
      })
      .attr("dy", ".35em")
      .text(function (d) {
        return d.data[0]
      })
  }
}

export default Pie
