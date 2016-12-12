var React = require('react');
import {connect} from 'react-redux'
var d3 = require('d3');

import {chr_sort, array_contains} from '../../../common/common'
import {draw_chromosome} from '../../../common/d3/chromosome'

const BARWIDTH = 1;
const CHRHEIGHT = 50;
const CHRMARGIN = 25;
const LABELMARGIN = 50;

class HistogramSet extends React.Component {

    constructor(props) {
	super(props);
	this._append_histogram = this._append_histogram.bind(this);
	this._margin = {top: 10, left: 10, right: 10, bottom: 10};
	this._get_rekeys = this._get_rekeys.bind(this);
	this._draw_feature = this._draw_feature.bind(this);
	this._redraw_grid = this._redraw_grid.bind(this);
	this._get_rekeys();
	this.state = {
	    k: 1,
	    hidden: {}
	};
    }
    
    _get_rekeys() {
	this._re_keys = [];
	this._colors = {};

	// make sure at least one histogram has features present
	var cptr = 0;
	if (!this.props.histograms) return;
	var keys = Object.keys(this.props.histograms);
	if (!keys || !keys.length) return;
	
	// get unique feature types, assign colors
	cptr = 0;
	keys.map((k) => {
	    if (!this.props.histograms[k].cytobands) return;
	    this.props.histograms[k].cytobands.map((c) => {
		if (c.feature.includes("both") && !array_contains(this._re_keys, c.feature)) {
		    this._re_keys.push(c.feature);
		    this._colors[c.feature] = "#00ff00";
		} else if (c.feature.includes("only") && !array_contains(this._re_keys, c.feature)) {
		    this._re_keys.push(c.feature);
		    this._colors[c.feature] = (cptr++ ? "#ff0000" : "#0000ff");
		}
	    });
	});
	
    }
    
    _draw_feature(f, g, size, _x) {
	if (array_contains(this._re_keys, f.feature)) {
	    if (!(f.feature in this.state.hidden) || !(this.state.hidden[f.feature])) {
		var width = _x(f.end - f.start);
		g.append("rect")
		    .attr("x", _x(f.start))
		    .attr("width", width * this.state.k > 2 ? width : 2)
		    .attr("fill", this._colors[f.feature])
		    .attr("height", size.height)
		    .attr("class", "resizable");
	    }
	    return true;
	}
	return false;
    }
    
    render() {
	this._get_rekeys();
	return (<div>
		   <div>
		   {this._re_keys.map((k) => {
		       var cstate = (k in this.state.hidden ? this.state.hidden[k] : false);
		       var onclick = () => {
			   var n = Object.assign({}, this.state.hidden);
			   n[k] = !cstate;
			   this.setState({
			       hidden: n
			   });
		       };
		       var checked = !cstate;
		       return (<div><input type="checkbox" onClick={onclick} checked={checked} /> <span style={{color: this._colors[k]}}>{k}</span></div>);
		   })}
		   </div>
		   <br /><div ref="container" />
		</div>);
    }

    _append_histogram(k, i) {
	
	var h = this.props.histograms[k];
	var div = $(this.props.container);
	var t = d3.max(h.cytobands, (d) => (d.end)) / 300000;
	var width = t * BARWIDTH;
	var height = CHRHEIGHT;

	var px = 0;
	var py = this._margin.top + i * (CHRHEIGHT + CHRMARGIN);
	
	var g = this._chrs.append("g")
	    .attr("transform", "translate(" + px + "," + py + ")");
	draw_chromosome(g, {width: width * this.state.k, height: CHRHEIGHT}, h.cytobands, this._draw_feature);

	this._chr_labels.append("g")
	    .attr("transform", "translate(" + px + "," + (py + (CHRHEIGHT / 2)) + ")")
	    .append("text").text(k);
	
	return;
	
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

	return svg;

    }

    _redraw_grid(size, offset, max) {
	
	// get spacing and scale, find first base in viewport
	var g = this._chrs.append("g")
	    .attr("width", size.width).attr("height", size.height);
	var _ix = d3.scaleLinear().domain([0, size.width]).range([0, max / this.state.k]);
	var spacing = size.width / 5;

	// loop and draw until off the end of the viewport
	for (var i = -offset; i < size.width - offset; i += spacing) {
	    if (_ix(i) > max) break;
	    if (_ix(i) < 0) continue;
	    g.append("rect")
		.attr("transform", "translate(" + i + ",0)")
	    	.attr("width", 1)
		.attr("height", size.height);
	    for (var j = 1; j < Object.keys(this.props.histograms).length; ++j) {
		g.append("text")
		    .attr("transform", "translate(" + (i + 5) + "," + (j * (CHRHEIGHT + CHRMARGIN)) + ")")
		    .text(Math.round(_ix(i)));	
	    }
	}
	
    }
    
    componentDidMount() {

	// create SVG, g elements
	this._rsvg = d3.select(this.refs.container).append("svg");
	this._chrs = this._rsvg.append("g")
	    .attr("transform", "translate(" + LABELMARGIN + ",0)");
	this._chr_labels = this._rsvg.append("g")
	    .attr("width", LABELMARGIN);
	this._chr_labels.append("rect")
	    .attr("fill", "#ffffff").attr("width", LABELMARGIN);
	this._grid = this._chrs.append("g");

	// attach zoom handler to SVG
	var zoom = () => {
	    this._chrs.attr("transform", "translate(" + d3.event.transform.x + ",0)");
	    this.setState({k: d3.event.transform.k});
	};
	this._zoom = d3.zoom().scaleExtent([1, 1048576]).on("zoom", zoom);
	this._rsvg.call(this._zoom);
	
    }
    
    componentDidUpdate() {

	// sort chromosomes, ensure at least one is present
	var h = this.props.histograms;
	var skeys = [...Object.keys(h)].sort(chr_sort);
	if (!h || !skeys) return;
	
	// refresh keys, graphic dimensions
	var height = skeys.length * (CHRHEIGHT + CHRMARGIN) + this._margin.top;
	var maxclen = d3.max(Object.keys(h), (k) => {
	    var d = h[k];
	    return (d.cytobands ? d3.max(d.cytobands, (_d) => (_d.end ? _d.end : 0)) : 0);
	});
	var width = maxclen / 300000 * BARWIDTH;
	this._rsvg
	    .attr("height", height)
	    .attr("width", width + LABELMARGIN);
	this._chrs.attr("height", height);
	this._chr_labels.attr("height", height);
	this._chr_labels.selectAll("rect").attr("height", height);

	// redraw chromosomes and grid
	var ptr = 0;
	this._chrs.selectAll("g").remove();
	this._chr_labels.selectAll("g").remove();
	this._redraw_grid({height, width}, +this._chrs.attr("transform").split("(")[1].split(",")[0] - LABELMARGIN,
			  maxclen);
	skeys.map((k, i) => {
	    if ((h[k].totals && h[k].corrs) || h[k].cytobands) {
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
