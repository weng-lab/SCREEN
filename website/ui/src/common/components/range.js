var React = require('react');
var ReactDOM = require('react-dom');
var d3 = require('d3');
var $ = require('jquery');
var __jui = require('jquery-ui-bundle');

class Histogram extends React.Component {
    
    constructor(props) {
	super(props);
    }
    
    render() {
	return <div ref="container" style={{width: "100%", height: "20px"}} />;
    }

    componentDidUpdate() {
	this._histogram = this.create_histogram(this.refs.container);
    }

    componentDidMount() {
	this.componentDidUpdate();
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
	    .domain([0, d3.max(this.props.data, function(d) { return d.doc_count; })])
	    .range([height, 0]);
	
	var bar = svg.selectAll(".bar")
	    .data(this.props.data)
	    .enter().append("g")
	    .attr("class", function(d) {
		return (d.key >= +srange[0] && d.key < +srange[1]
			? "barselected" : "bardeselected");
	    })
	    .attr("transform", function(d) { return "translate(" + x(d.key) + "," + y(d.doc_count) + ")"; });
	
	bar.append("rect")
	    .attr("x", 1)
	    .attr("width", x(this.props.interval + xrange[0]))
	    .attr("height", function(d) { return height - y(d.doc_count); });

	return svg;
	
    }

    /*
     * to be called as the user is dragging the associated slider
     * this prevents a re-render of the component until the user has released the mouse
     */
    update_selection(min, max) {
	this._histogram.selectAll("g")
            .data(this.props.data)
            .attr("class", function(d) { return (d.key >= +min && d.key < +max ? "barselected" : "bardeselected"); });   	
    }

}

class RangeSlider extends React.Component {
    
    constructor(props) {
	super(props);
	this.onMinChange = this.onMinChange.bind(this);
	this.onMaxChange = this.onMaxChange.bind(this);
	this._set_selection = this._set_selection.bind(this);
	this.update_selection = this.update_selection.bind(this);
    }
    
    render() {
	return (<div><br/>
		   <input ref="txmin" type="text" value={this.props.selection_range[0]} onChange={this.onMinChange}
	 	      style={{width: "45%"}} /> -
		   <input ref="txmax" type="text" value={this.props.selection_range[1]} onChange={this.onMaxChange}
		      style={{width: "45%"}} />
  		   <div ref="container" />
		</div>
	       );
    }

    componentDidMount() {
	this.componentDidUpdate();
    }
    
    componentDidUpdate() {
	this._slider = this.create_range_slider(this.refs.container);
    }

    onMinChange() {
	var srange = [+this.refs.txmin.value, +this.refs.txmax.value];
	if (srange[0] > srange[1]) srange[0] = srange[1];
	if (srange[0] < this.props.range[0]) srange[0] = this.props.range[0];
	this.set_selection(srange);
    }

    onMaxChange() {
	var srange = [+this.refs.txmin.value, +this.refs.txmax.value];
	if (srange[1] < srange[0]) srange[1] = srange[0];
	if (srange[1] > this.props.range[1]) srange[1] = this.props.range[1];
	this.set_selection(srange);
    }
    
    create_range_slider(dcontainer) {
	var container = $(dcontainer);
	container.empty().slider({
	    range: true,
	    min: this.props.range[0],
	    max: this.props.range[1],
	    values: [ this.props.selection_range[0], this.props.selection_range[1] ],
	    stop: this._set_selection,
	    slide: this.update_selection
	});
	return container;
    }

    update_selection(event, ui) {
	var r = this._slider.slider("values");
	this.refs.txmin.value = r[0];
	this.refs.txmax.value = r[1];
	if (this.props.onslide) this.props.onslide(r);
    }
    
    _set_selection(event, ui) {
	var r = this._slider.slider("values");
	this.set_selection(r);
    }

    set_selection(r) {
	if (this.props.onchange) this.props.onchange(r);
    }
    
}

const zeros = (range, interval) => {
    var retval = [];
    for (var i = range[0]; i < range[1]; i += interval) {
	retval.push({
	    key: i,
	    doc_count: 0
	});
    }
    return retval;
};

class RangeFacet extends React.Component {

    constructor(props) {
	super(props);
	
	var h_data = (this.props.h_data == null
		      ? zeros(this.props.range, this.props.h_interval)
		      : this.props.h_data);
	this.state = {
	    selection_range: this.props.selection_range,
	    h_data: h_data
	};
	
	this.slide_handler = this.slide_handler.bind(this);
	this.selection_change_handler = this.selection_change_handler.bind(this);
    }
    
    slide_handler(r) {
	this.refs.histogram.update_selection(...r);
    }

    selection_change_handler(r) {
	this.setState({
	    selection_range: [+r[0], +r[1]]
	});
	if (this.props.onchange) this.props.onchange();
    }
    
    render() {
	return (<div>
		   <Histogram
		      range={this.props.range} selection_range={this.state.selection_range}
		      interval={this.props.h_interval} data={this.state.h_data}
		      margin={this.props.h_margin} ref="histogram"
		   />
		   <RangeSlider
		      range={this.props.range} selection_range={this.state.selection_range}
		      onslide={this.slide_handler} onchange={this.selection_change_handler} ref="slider"
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
    
    ReactDOM.render(<RangeFacet range={range} h_margin={h_margin} selection_range={srange} h_interval="10" h_data={data} />, document.getElementById("range_facet"));

})();
