import React from 'react';

import {linearScale} from '../utility';
import {chain_functions} from '../common';

class HistogramSlider extends React.Component {
    constructor(props) {
	super(props);
	this.makeBars = this.makeBars.bind(this);
	this.state = {height: 0};
	window.onresize = chain_functions(window.onresize, this.componentDidUpdate);
    }

    /* componentDidMount() {
       this._histogram = this.create_histogram(this.refs.histogram);
     * }

     * update_selection(lvalue, rvalue) {
       this._histogram.selectAll("g")
       .data(this.props.data)
       .attr("class", (d) => (d.key >= this.props.lvalue && d.key < this.props.rvalue ?
       "barselected"
       : "bardeselected"));
     * }
     * 
     * _update_width() {
       if (this.props.updateWidth) {
       this.props.updateWidth($(this.refs.histogram).width());
       }
     * }

     * create_histogram(destination_div) {
       $(destination_div).empty();

       var div = $(destination_div);
       var height = div.height();
       var width = div.width();
       var xrange = this.props.range;

       const data = this.props.data;
       if(!data){
       return;
       }
       
       var svg = d3.select(destination_div).append("svg")
       .attr("width", width)
       .attr("height", height);

       svg.append("g")
       .attr("transform", "translate(" + this.props.margin.left + "," + this.props.margin.top + ")");

       var x = d3.scaleLinear()
     *         .domain(xrange)
       .rangeRound([0, width]);

       var y = d3.scaleLinear()
       .domain([0, data.binMax])
       .range([height, 0]);

       var bar = svg.selectAll(".bar")
       .data(data.bins)
       .enter().append("g")
       .attr("fill", function(d) {
       return (d[0] >= this.state.lvalue && d[0] < this.state.rvalue
       ? "#000090" : "#a0a0a0");
       })
       .attr("transform", function(d) { return "translate(" + x(d[0]) + "," + y(d[1]) + ")"; });

       bar.append("rect")
       .attr("x", 1)
       .attr("width", x(this.props.interval + xrange[0]))
       .attr("height", function(d) { return height - y(d[1]); });

       return svg;

     * }
     */
    makeBars(){

    }
    
    render() {
	const width = 10;
	const height = 10;
	const xScale = linearScale(this.props.range, [0, width]);
	const yScale = linearScale([0, this.props.data.binMax], [height, 0]);
	
	return (
	    <div style={{width: "100%", height: "20px"}}>
	    {this.state.height > 0 && this.makeBars()}
	    </div>);
    }
}

export default HistogramSlider;
