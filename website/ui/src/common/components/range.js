import React from 'react';
import $ from 'jquery';

import Slider from './slider';

import {chain_functions} from '../common';

let d3 = require('d3');

class RangeSlider extends React.Component {

    constructor(props) {
	super(props);
	this.onMinChange = this.onMinChange.bind(this);
	this.onMaxChange = this.onMaxChange.bind(this);
	this.set_selection = this.set_selection.bind(this);
	this.update_selection = this.update_selection.bind(this);
	this._update_width = this._update_width.bind(this);
	this.componentDidUpdate = this.componentDidUpdate.bind(this);
	this._rvalue = this._rvalue.bind(this);
	this._ontxchange = this._ontxchange.bind(this);
	this._value = this._value.bind(this);
	this._keypress = this._keypress.bind(this);
	let _v = this._value;
	this.state = {
	    selection_range: props.selection_range.map(_v)
	};
	window.onresize = chain_functions(window.onresize, this.componentDidUpdate);
    }

    componentWillReceiveProps(props) {
	let _v = this._value;
	this.setState({
	    selection_range: props.selection_range.map(_v)
	});
    }

    _value(v) {
	return (this.props.rendervalue ? this.props.rendervalue(v) : v);
    }

    _rvalue(s) {
	return (this.props.reversevalue ? this.props.reversevalue(s) : s);
    }

    _ontxchange() {
	this.setState({
	    selection_range: [this.refs.txmin.value, this.refs.txmax.value]
	});
    }

    _keypress(e) {
	if (e.which === 13) {
	    this.onMinChange();
	}
    }
    
    render() {
	return (
	    <div>
		<div style={{fontWeight: "bold"}}>{this.props.title}</div>
	        {!this.props.nohistogram && <div ref="histogram"
						 style={{width: "100%", height: "20px"}} />}
		<Slider
		    range={this.props.range}
		    start={this.props.selection_range}
		    dragLeft={this.update_selection}
		    dragRight={this.update_selection}
		    onStop={this.set_selection}
		    connect
		/>
  		<div ref="container" />
		<div style={{textAlign: "center", paddingTop: "10px"}}>
		    <input ref="txmin"
			   type="text"
			   value={this.state.selection_range[0]}
			   onChange={this._ontxchange} onBlur={this.onMinChange}
	 	           style={{textAlign: "center", width: "40%",
				   position: "relative", fontWeight: "bold"}}
			   onKeyDown={this._keypress} /> -&nbsp;
		    <input ref="txmax" type="text"
			   value={this.state.selection_range[1]}
			   onChange={this._ontxchange} onBlur={this.onMaxChange}
		           style={{textAlign: "center", width: "40%",
				   position: "relative", fontWeight: "bold"}}
			   onKeyDown={this._keypress} />
		</div>
	    </div>);
    }

    _update_width() {
	if (this.props.updateWidth) {
	    this.props.updateWidth($(this.refs.histogram).width());
	}
    }

    create_histogram(destination_div) {
	$(destination_div).empty();

	var div = $(destination_div);
	var height = div.height();
	var width = div.width();
	var xrange = this.props.range;
	var srange = this.props.selection_range;

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
            .domain(xrange)
	    .rangeRound([0, width]);

	var y = d3.scaleLinear()
	    .domain([0, data.binMax])
	    .range([height, 0]);

	var bar = svg.selectAll(".bar")
	    .data(data.bins)
	    .enter().append("g")
	    .attr("fill", function(d) {
		return (d[0] >= +srange[0] && d[0] < +srange[1]
			? "#000090" : "#a0a0a0");
	    })
	    .attr("transform", function(d) { return "translate(" + x(d[0]) + "," + y(d[1]) + ")"; });

	bar.append("rect")
	    .attr("x", 1)
	    .attr("width", x(this.props.interval + xrange[0]))
	    .attr("height", function(d) { return height - y(d[1]); });

	return svg;

    }

    componentDidMount() {
	this.componentDidUpdate();
    }

    componentDidUpdate() {
	this._histogram = this.create_histogram(this.refs.histogram);
    }

    onMinChange() {
	var srange = [+this._rvalue(this.refs.txmin.value), +this._rvalue(this.refs.txmax.value)];
	if (isNaN(srange[0])) srange[0] = 0.0;
	if (isNaN(srange[1])) srange[1] = srange[0];
	if (Math.round(srange[1]) <= Math.round(srange[0])) srange[1] = srange[0] + 1;
	//console.log(srange);
//	if (srange[0] > srange[1]) srange[0] = srange[1];
//	if (srange[0] < this.props.range[0]) srange[0] = this.props.range[0];
	this.set_selection(srange);
    }

    onMaxChange() {
	var srange = [+this._rvalue(this.refs.txmin.value), +this._rvalue(this.refs.txmax.value)];
	if (isNaN(srange[0])) srange[0] = 0.0;
	if (isNaN(srange[1])) srange[1] = srange[0];
	if (Math.round(srange[1]) <= Math.round(srange[0])) srange[1] = srange[0] + 1;
	//console.log(srange);
//	if (srange[1] < srange[0]) srange[1] = srange[0];
//	if (srange[1] > this.props.range[1]) srange[1] = this.props.range[1];
	this.set_selection(srange);
    }

    update_selection(lvalue, rvalue) {
	//console.log("range:", "update_selection", lvalue, rvalue);
	this.refs.txmin.value = lvalue;
	this.refs.txmax.value = rvalue;
	if(!this.props.nohistogram){
	    this._histogram.selectAll("g")
		.data(this.props.data)
		.attr("class", (d) => (d.key >= lvalue && d.key < rvalue ? "barselected"
				     : "bardeselected"));
	}
    }

    set_selection(lvalue, rvalue) {
	//console.log("range:", "set_selection", lvalue, rvalue);
	if (this.props.onchange) {
            this.props.onchange(lvalue, rvalue);
        }
    }
}

const zeros = (range, interval) => {
    var bins = [];
    for (var i = range[0]; i < range[1]; i += interval) {
	bins.push([i, 0]);
    }
    return {"bins" : bins,
            "numBins" : bins.lengths,
            "binMax" : 0}
};

class RangeFacet extends React.Component {

    constructor(props) {
	super(props);
	this.selection_change_handler = this.selection_change_handler.bind(this);
    }

    selection_change_handler(r) {
	if (this.props.onchange) {
            this.props.onchange(r);
        }
    }

    render() {
	var h_data = (this.props.h_data === null
		      ? zeros(this.props.range, this.props.h_interval)
		    : this.props.h_data);
	return (<div>
		   <RangeSlider
		      nohistogram={this.props.nohistogram}
		      range={this.props.range}
                      selection_range={this.props.selection_range}
		      interval={this.props.h_interval} data={h_data}
                      margin={this.props.h_margin}
		      onchange={this.selection_change_handler}
                      ref="slider"
                      title={this.props.title}
		      updateWidth={this.props.updateWidth}
		      rendervalue={this.props.rendervalue}
		      reversevalue={this.props.reversevalue}
		   />
		</div>
	       );
    }

}

export default RangeFacet;
