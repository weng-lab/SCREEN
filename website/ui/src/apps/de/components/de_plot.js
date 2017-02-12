import React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

class DePlot extends React.Component {
    componentDidMount() {
	this.componentDidUpdate();
    }

    render() {
        let ct1 = Globals.cellTypeInfo[this.props.ct1]["name"];
        let ct2 = Globals.cellTypeInfo[this.props.ct2]["name"];
        let geneName1 = this.props.data.nearbyDEs.names[0];
        let geneName2 = this.props.data.nearbyDEs.names[1];

        let subtitle = (geneName1 === geneName2 ? "" :
                        <span className={"deSubtitle"}>{geneName2}</span>
                       );

        let title = (<div>
                     <table className={"deTitleTable"}>
                     <tr>
                     <td><span className={"deGene"}>{geneName1}</span></td>
                     <td>
                     <span className={"deCT"}>{ct1}</span>
                     <span className={"deVS"}>{" vs "}</span>
                     <span className={"deCT"}>{ct2}</span>
                     </td>
                     </tr>
                     <tr>
                     <td>
                     {subtitle}
                     </td>
                     </tr>
                     </table>
                     </div>);

	return (<div>
                <span ref="help_icon" />
                {title}
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
	let xdomain = this.props.data.xdomain;

        var y_domain = d3.extent(data, function(d) { return d[1]; });

        let barYdomain = [Math.min(y_domain[0],
				   this.props.data.nearbyDEs.ymin),
                          this.props.data.nearbyDEs.ymax];
	y_domain = [Math.min(y_domain[0], barYdomain[0]), Math.max(y_domain[1], barYdomain[1])];

        var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;
	var color = d3.scale.ordinal().domain(["enhancer-like", "promoter-like"]).range(["#ffcd00", "#ff0000"]);
        var x = d3.scale.linear()
            .domain(xdomain).nice()
            .range([0, width]);
        var xr = d3.scale.linear()
            .domain([0, xdomain[1] - xdomain[0]]).nice()
            .range([0, width]);
        var y = d3.scale.linear()
            .domain(y_domain).nice()
            .range([height, 0]);
        var xAxis = d3.svg.axis()
            .ticks(6)
            .scale(x)
            .orient("bottom");
        var yAxisRight = d3.svg.axis().scale(y)
            .orient("right");
        var svg = d3.select(chart).append("svg")
            .attr("width", width + margin.left + margin.right + 50)
            .attr("height", height + margin.top + margin.bottom + this.props.data.nearbyDEs.data.length * 20)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top+ ")");
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", width - 15)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text(this.props.data.coord.chrom + " coordinates");
	svg.append("g")
	    .append("line")
	    .style("stroke-dasharray", ("3,3"))
	    .attr("y1", y(0))
	    .attr("y2", y(0))
	    .attr("x1", 0)
	    .attr("x2", width)
	    .style("stroke", "#ff0000");
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + width + " ,0)")
            .call(yAxisRight)
            .append("text")
            .attr("class", "ylabel")
            .attr("transform", "rotate(-90)")
            .attr("y", -20)
	    .attr("x", 0)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("change in cRE Z-score")
        svg.selectAll(".dot")
            .data(data)
            .enter().append("rect")
            .attr("class", "rect")
            .attr("height", 5)
	    .attr("width", function(c) { return xr(2 * c[3]); })
            .attr("x", function(c) { return x(c[0] - c[3]); })
            .attr("y", function(c) { return y(c[1]); })
            .style("fill", function(c) { return color(c[2]); });
	var genelabels = svg.append("g")
	    .attr("transform", "translate(0," + (height + margin.top + 20) + ")")
	    .attr("width", width)
	    .attr("height", this.props.data.nearbyDEs.data.length * 20);
	genelabels.selectAll(".line")
	    .data(this.props.data.nearbyDEs.data)
	    .enter()
	    .append("line")
	    .attr("x2", (d) => (x(d[3]))).attr("x1", (d) => (x(d[2])))
	    .attr("y1", (d, i) => (i * 20)).attr("y2", (d, i) => (i * 20))
	    .style("stroke", function(d){
                var strand = d[7];
                switch(strand) {
                case '+': return "#FF0000";
                case '-': return "#1E90FF";
                default: return "#000000";
                }})
	genelabels.selectAll(".label")
	    .data(this.props.data.nearbyDEs.data)
	    .enter()
	    .append("text")
	    .attr("x", (d) => (x(d[3]) + 10))
	    .attr("y", (d, i) => (i * 20 + 4))
            .style("font-style", "italic")
	    .text((d) => (d[6]));
        var legend = svg.selectAll(".legend")
            .data(color.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) {
                return "translate(0," + i * 20 + ")"; });
        var legendX = width - 80;
        var lengthTextX = legendX - 6;
        legend.append("circle")
            .attr("cx", legendX + 9)
	    .attr("r", 9)
	    .attr("cy", 9)
            .style("fill", color);
        legend.append("text")
            .attr("x", lengthTextX)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });

        var bars = this.props.data.nearbyDEs.data;
        var bar = svg.selectAll(".bar")
            .data(bars)
            .enter().append("g");
        bar.append("rect")
            .attr("class", "bar1")
            .attr("x", function(d) {
                return x(d[2]);
            })
            .attr("width", function(d){
                return x(d[3]) - x(d[2]);})
            .attr("y", function(d) {
                return d[1] < 0 ? y(0) : y(d[1]);
            })
            .attr("height", function(d) {
                let height = d[1] < 0 ? -y(0) + y(d[1]) : -y(d[1]) + y(0);
		return (height < 2 ? 2 : height);
            });
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");
        svg.append("g")
            .attr("class", "y axis")
            .style("fill", "steelblue")
            .call(yAxis)
            .append("text")
            .attr("class", "ylabel")
            .attr("transform", "rotate(-90)")
            .attr("y", 7)
            .attr("dy", "0.71em")
            .style("text-anchor", "end")
            .text("log2 gene expression fold change")
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(DePlot);
