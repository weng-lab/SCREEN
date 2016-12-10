var React = require('react');
import {connect} from 'react-redux'
var d3 = require('d3');

import {chr_sort} from '../../../common/common'

const BARWIDTH = 1;
const CHRHEIGHT = 50;

class HistogramSet extends React.Component {

    constructor(props) {
	super(props);
	this._append_histogram = this._append_histogram.bind(this);
	this._margin = {top: 10, left: 10, right: 10, bottom: 10};
	this._zoom = this._zoom.bind(this);
    }

    render() {
	return <div ref="container" />;
    }

    _zoom() {
	this._svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    _append_histogram(k, i) {
	
	var h = this.props.histograms[k];
	var div = $(this.props.container);
	var width = h.totals.length * BARWIDTH;
	var height = CHRHEIGHT;
	var xrange = [0, h.totals.length];

	var px = this._margin.left;
	var py = this._margin.top + i * (CHRHEIGHT + 10);
	
	var svg = this._svg.append("g")
	    .attr("width", width + 50)
	    .attr("height", CHRHEIGHT)
	    .attr("transform", "translate(" + px + "," + py + ")");

	svg.append("g")
	    .attr("transform", "translate(0, " + (CHRHEIGHT / 2) + ")")
	    .append("text").text(k);
	var g = svg.append("g")
	    .attr("transform", "translate(50, 0)");
	
	var x = d3.scaleLinear()
            .domain(xrange)
	    .rangeRound([0, width]);
	
	var y = d3.scaleLinear()
	    .domain([0, d3.max(h.totals, (d) => (d))])
	    .range([height, 0]);

	var c = d3.scaleLinear()
	    .domain([0.0, 1.0])
	    .range(["#ff0000", "#0000ff"]);
	
	var bar = g.selectAll(".bar")
	    .data(h.totals)
	    .enter().append("g")
	    .attr("transform", function(d, i) { return "translate(" + x(i) + "," + (height / 2 - (height - y(d)) / 2) + ")"; });
	
	bar.append("rect")
	    .attr("x", 1)
	    .attr("width", x(1))
	    .attr("fill", (d, i) => c(h.corrs[i]))
	    .attr("height", function(d) { return height - y(d) + 2; });

	this._svg.call(d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", zoom));

	return svg;

    }
    
    componentDidUpdate() {
	var h = this.props.histograms;
	var skeys = [...Object.keys(h)].sort(chr_sort);
	var ptr = 0;
	if (!h || !skeys) return;
	$(this.refs.container).empty();
	console.log(h);
	this._svg = d3.select(this.refs.container).append("svg")
	    .attr("height", skeys.length * CHRHEIGHT + this._margin.top)
	    .attr("width", d3.max(Object.keys(h), (k) => (h[k] && h[k].totals ? h[k].totals.length : 0)) * BARWIDTH + 50);
	skeys.map((k, i) => {
	    if (h[k].totals && h[k].corrs) {
		this._append_histogram(k, ptr++);
	    }
	});
    }
    
}
export default HistogramSet;

const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	histograms: state.histograms
    };
};

export const histogram_connector = (pf) => connect(props_map(pf));

class Histogram extends React.Component {

    constructor(props) {
	super(props);
    }

    componentDidMount() {
	this.componentDidUpdate();
    }

    componentDidUpdate() {
	this.create_histogram(this.refs.container);
    }

    render() {
	return <div style={{height: "40px"}}>{this.props.title} <span ref="container" /></div>;
    }
    
    create_histogram(destination_div) {

	$(destination_div).empty();
	if (!this.props.heights) return;
	
	
    }
    
}
