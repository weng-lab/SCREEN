import React from 'react'

class HugeBars extends React.Component {
    componentDidMount() {
	this.componentDidUpdate();
    }

    render() {

	return (<div>
 	        <span style={{fontSize: "18pt"}}>
                <span ref="help_icon" />
                {this.props.gwas_study}
                </span>

		<div style={{"width": "100%"}} ref="chart" />
		</div>);
    }

    componentDidUpdate() {
        let chart = this.refs.chart;
	$(chart).empty();
        let data = this.props.data;

	var width = 600;
	var height = 100;
	var radius = Math.min(width, height) / 2;

	let xdomain = [0,100]
        let ydomain = [0,1]

        var margin = {top: 2, right: 2, bottom: 3, left: 4},
        width = width - margin.left - margin.right,
        height = height - margin.top - margin.bottom;

        var color = d3.scale.ordinal()
	    .range(["#F4D03F", "#2ECC71"]);

        var x = d3.scale.linear()
            .domain(xdomain).nice()
            .range([0, width]);
        var y = d3.scale.linear()
            .domain(ydomain).nice()
            .range([height, 0]);

        var svg = d3.select(chart).append("svg")
            .attr("width", width + margin.left + margin.right + 50)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top+ ")");
        svg.selectAll(".dot")
            .data(data)
            .enter().append("rect")
            .attr("class", "rect")
            .attr("height", height)
	    .attr("width", function(c) { return x(c[1]); })
            .attr("x", function(c) { return x(c[2]); })
            .attr("y", function(c) { return y(1); })
            .style("fill", function(c) { return color(c[1]); });

	var genelabels = svg.append("g")
	    .attr("transform", "translate(0,"+ (margin.top + 20) +")")
	    .attr("width", width)
	    .attr("height", 20);
	genelabels.selectAll(".label")
	    .data(data)
	    .enter()
	    .append("text")
	    .attr("x", (d) => (x(0) + 10))
	    .attr("y", (d, i) => (y(0.5)))
	    .text((d) => (d[0]));
    }
}

export default HugeBars;
