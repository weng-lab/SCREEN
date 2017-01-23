import React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import REComponent from '../../../common/components/re_component'

import LargeHorizontalBars from '../components/large_horizontal_bars'

class ExpressionBoxplot extends React.Component {
    componentDidMount() {
	this.componentDidUpdate();
    }

    componentDidUpdate() {

// from http://bl.ocks.org/mbostock/3887118

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  data.forEach(function(d) {
    d[0] = +d[0];
    d[1] = +d[1];
  });

  x.domain(d3.extent(data, function(d) { return d[1]; })).nice();
  y.domain(d3.extent(data, function(d) { return d[0]; })).nice();

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("coord");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("log2 fold change")

  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return x(d[1]); })
      .attr("cy", function(d) { return y(d[0]); })
      .style("fill", function(d) { return color(d[4]); });

  var legend = svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
.attr("transform", function(d, i) {
return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });

	var width = 800;
	var barheight = "15";
	render(React.createElement(LargeHorizontalBars,
                                   {...this.props, width, barheight}),
	       this.refs.bargraph);
    }

    render() {
	return (<div>
 	        <span style={{fontSize: "18pt"}}>
                {this.props.gene} <span ref="help_icon" />
                </span>
		<div style={{"width": "100%"}} ref="bargraph" />
		</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(ExpressionBoxplot);
