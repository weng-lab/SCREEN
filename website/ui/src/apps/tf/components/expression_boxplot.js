import React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

class ExpressionBoxplot extends React.Component {
    componentDidMount() {
	this.componentDidUpdate();
    }

    render() {
        if(this.props.selectCT){
            return (<div>
                    {"Please choose 2 cell types on left"}
                    </div>);
        }

	return (<div>
 	        <span style={{fontSize: "18pt"}}>
                <span ref="help_icon" />
                {this.props.gene}
                </span>

 	        <span style={{fontSize: "14pt"}}>
                {": "}
                {Globals.cellTypeInfo[this.props.ct1]["name"]}
                {" vs "}
                {Globals.cellTypeInfo[this.props.ct2]["name"]}
                </span>

		<div style={{"width": "100%"}} ref="chart" />
		</div>);
    }

    componentDidUpdate() {
        // from http://bl.ocks.org/mbostock/3887118
        // and http://stackoverflow.com/a/30955562
        // and http://bl.ocks.org/d3noob/e34791a32a54e015f57d
        let chart = this.refs.chart;
	$(chart).empty();
        let data = this.props.data.diffCREs.data;

        var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
        var x_domain = d3.extent(data, function(d) { return d[0]; });
        var y_domain = d3.extent(data, function(d) { return d[1]; });
        var x = d3.scale.linear()
            .domain(x_domain).nice()
            .range([0, width]);
        var y = d3.scale.linear()
            .domain(y_domain).nice()
            .range([height, 0]);
        var color = d3.scale.category10();
        var xAxis = d3.svg.axis()
            .ticks(3)
            .scale(x)
            .orient("bottom");
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");
        var svg = d3.select(chart).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top+ ")");
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
            .attr("class", "ylabel")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("change in cRE Z-score")
        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 3.5)
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .style("fill", function(d) { return color(d[2]); });
        var legend = svg.selectAll(".legend")
            .data(color.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) {
                return "translate(0," + i * 20 + ")"; });
        var legendX = width - 80;
        var lengthTextX = legendX - 6;
        legend.append("rect")
            .attr("x", legendX)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);
        legend.append("text")
            .attr("x", lengthTextX)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });

        var bars = this.props.data.nearbyDEs.data;
        y_domain = d3.extent(bars, function(d) { return d[1]; });
        y = d3.scale.linear()
            .domain(y_domain).nice()
            .range([height, 0]);
        var bar = svg.selectAll(".bar")
            .data(bars)
            .enter().append("g");
        bar.append("rect")
            .attr("class", "bar1")
            .attr("x", function(d) {
                return x(d[0]);
            })
            .attr("width", function(d){
                return x(d[3]) - x(d[2]);})
            .attr("y", function(d) {
                return y(d[1]);
            })
            .attr("height", function(d) {
                return height - y(d[1]);
            });
        var yAxisRight = d3.svg.axis().scale(y)
            .orient("left");
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + width + " ,0)")
            .style("fill", "steelblue")
            .call(yAxisRight)
            .append("text")
            .attr("class", "ylabel")
            .attr("transform", "rotate(-90)")
            .attr("y", 7)
            .attr("dy", "0.71em")
            .style("text-anchor", "end")
            .text("log2 fold change")
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(ExpressionBoxplot);
