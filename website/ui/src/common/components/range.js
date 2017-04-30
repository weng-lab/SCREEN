var React = require('react');
var ReactDOM = require('react-dom');
var d3 = require('d3');
var $ = require('jquery');
var __jui = require('jquery-ui-bundle');

import {chain_functions} from '../common'

class RangeSlider extends React.Component {

    constructor(props) {
	super(props);
	this.onMinChange = this.onMinChange.bind(this);
	this.onMaxChange = this.onMaxChange.bind(this);
	this._set_selection = this._set_selection.bind(this);
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
	if (e.which == 13) {
	    this.onMinChange();
	}
    }
    
    render() {
	let histogram = (this.props.nohistogram ? "" : <div ref="histogram" style={{width: "100%", height: "20px"}} />);
	return (<div>
		   <div style={{fontWeight: "bold"}}>{this.props.title}</div>
	           {histogram}
  		   <div ref="container" />
		<div style={{textAlign: "center", paddingTop: "10px"}}>
		<input ref="txmin" type="text" value={this.state.selection_range[0]} onChange={this._ontxchange} onBlur={this.onMinChange}
	 	         style={{textAlign: "center", width: "40%", position: "relative", fontWeight: "bold"}} onKeyDown={this._keypress} /> -&nbsp;
		<input ref="txmax" type="text" value={this.state.selection_range[1]} onChange={this._ontxchange} onBlur={this.onMaxChange}
		         style={{textAlign: "center", width: "40%", position: "relative", fontWeight: "bold"}} onKeyDown={this._keypress} />
		</div>
		</div>
	       );
    }

    _update_width() {
	if (this.props.updateWidth) this.props.updateWidth($(this.refs.histogram).width());
    }

    create_histogram(destination_div) {

	$(destination_div).empty();

	var div = $(destination_div);
	var height = div.height();
	var width = div.width();
	var xrange = this.props.range;
	var srange = this.props.selection_range;

	var svg = d3.select(destination_div).append("svg")
	    .attr("width", width)
	    .attr("height", height);

	svg.append("g")
	    .attr("transform", "translate(" + this.props.margin.left + "," + this.props.margin.top + ")");

	var x = d3.scaleLinear()
            .domain(xrange)
	    .rangeRound([0, width]);

	var y = d3.scaleLinear()
	    .domain([0, this.props.data.binMax])
	    .range([height, 0]);

	var bar = svg.selectAll(".bar")
	    .data(this.props.data.bins)
	    .enter().append("g")
	    .attr("class", function(d) {
		return (d[0] >= +srange[0] && d[0] < +srange[1]
			? "barselected" : "bardeselected");
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
	this._slider = this.create_range_slider(this.refs.container);
	this._histogram = this.create_histogram(this.refs.histogram);
	this._handles = $(this._slider).find(".ui-slider-handle");
	$(this._handles[1]).css("margin-left", "0px");
    }

    onMinChange() {
	var srange = [+this._rvalue(this.refs.txmin.value), +this._rvalue(this.refs.txmax.value)];
	if (isNaN(srange[0])) srange[0] = 0.0;
	if (isNaN(srange[1])) srange[1] = srange[0];
	if (srange[1] <= srange[0]) srange[1] = srange[0] + 1;
	//console.log(srange);
//	if (srange[0] > srange[1]) srange[0] = srange[1];
//	if (srange[0] < this.props.range[0]) srange[0] = this.props.range[0];
	this.set_selection(srange);
    }

    onMaxChange() {
	var srange = [+this._rvalue(this.refs.txmin.value), +this._rvalue(this.refs.txmax.value)];
	if (isNaN(srange[0])) srange[0] = 0.0;
	if (isNaN(srange[1])) srange[1] = srange[0];
	if (srange[1] <= srange[0]) srange[1] = srange[0] + 1;
	//console.log(srange);
//	if (srange[1] < srange[0]) srange[1] = srange[0];
//	if (srange[1] > this.props.range[1]) srange[1] = this.props.range[1];
	this.set_selection(srange);
    }

    create_range_slider(dcontainer) {
	var container = $(dcontainer);
	container.empty().slider({
	    range: true,
	    min: this.props.range[0],
	    max: this.props.range[1],
	    values: [ +this.props.selection_range[0], +this.props.selection_range[1] ],
	    stop: this._set_selection,
	    slide: this.update_selection
	});
	return container;
    }

    update_selection(event, ui) {
	var r = this._slider.slider("values");
	this.refs.txmin.value = this._value(r[0]);
	this.refs.txmax.value = this._value(r[1]);
	this._histogram.selectAll("g")
            .data(this.props.data)
            .attr("class", function(d) { return (d.key >= +r[0] && d.key < +r[1] ? "barselected" : "bardeselected"); });
    }

    _set_selection(event, ui) {
	var r = this._slider.slider("values");
	this.set_selection(r);
    }

    set_selection(r) {
	if (r[1] <= r[0]) r[1] = r[0] + 1;
	if (this.props.onchange) {
            this.props.onchange(r);
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
	var h_data = (this.props.h_data == null
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

/*
 * test function with dummy data
 */
(function() {

    if (!document.getElementById("range_facet")) return;

    var data = [];
    for (var i = 0; i < 1000; i++) {
	data.push({key: i * 10,
		   doc_count: Math.round(Math.random() * 1000)
		  });
    }

    var range = [0, 10000];
    var srange = [0, 4000];
    var h_margin = {top: 1, bottom: 1, left: 1, right: 1};
    var h_interval = 10;

    ReactDOM.render(
	<RangeFacet range={range} h_margin={h_margin}
		    selection_range={srange} h_interval="10"
		    h_data={data} />,
	document.getElementById("range_facet"));
})();
