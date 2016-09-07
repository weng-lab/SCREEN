var React = require('react');
var ReactDOM = require('react-dom');
var d3 = require('d3');
var $ = require('jquery');
var __jui = require('jquery-ui-bundle');

var Histogram = React.createClass({
    
    render: function() {
	return <div ref="container" style={{width: "100%", height: "20px"}} />;
    },

    componentDidMount: function() {
	this._histogram = this.create_histogram(this.refs.container);
    },

    create_histogram: function(destination_div) {

	var div = $(destination_div);
	var height = div.height();
	var width = div.width();
	var xrange = [this.props.range.min, this.props.range.max];
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
		return (d.key >= +srange.min && d.key < +srange.max
			? "barselected" : "bardeselected");
	    })
	    .attr("transform", function(d) { return "translate(" + x(d.key) + "," + y(d.doc_count) + ")"; });
	
	bar.append("rect")
	    .attr("x", 1)
	    .attr("width", x(this.props.interval + xrange[0]))
	    .attr("height", function(d) { return height - y(d.doc_count); });

	return svg;
	
    },

    /*
     * to be called as the user is dragging the associated slider
     * this prevents a re-render of the component until the user has released the mouse
     */
    update_selection: function(min, max) {
	this._histogram.selectAll("g")
            .data(this.props.data)
            .attr("class", function(d) { return (d.key >= +min && d.key < +max ? "barselected" : "bardeselected"); });   	
    }

});

var RangeSlider = React.createClass({

    getInitialState: function() {
	return {selection_range: this.props.selection_range};
    },
    
    render: function() {
	var value = this.state.selection_range.min + " - " + this.state.selection_range.max;
	return (<div><br/>
		   <input ref="txbox" type="text" value={value} />
  		   <div ref="container" />
		</div>
	       );
    },

    componentDidMount: function() {
	this._slider = this.create_range_slider(this.refs.container);
    },
    
    create_range_slider: function(dcontainer) {
	var container = $(dcontainer);
	console.log(container);
	container.slider({
	    range: true,
	    min: this.props.range.min,
	    max: this.props.range.max,
	    values: [ this.state.selection_range.min, this.state.selection_range.max ],
	    stop: this.set_selection,
	    slide: this.update_selection
	});
	return container;
    },

    update_selection: function(event, ui) {
	var r = this._slider.slider("values");
	this.refs.txbox.value = r[0] + " - " + r[1];
	if (this.props.onslide) this.props.onslide(r);
    },
    
    set_selection: function(event, ui) {
	var r = this._slider.slider("values");
	this.setState({selection_range: {min: r[0], max: r[1]}});
    }
    
});

var RangeFacet = React.createClass({

    slide_handler: function(r) {
	this.refs.histogram.update_selection(...r);
    },
    
    render: function() {
	return (<div>
		   <Histogram
		      range={this.props.range} selection_range={this.props.srange}
		      interval={this.props.h_interval} data={this.props.h_data}
		      margin={this.props.h_margin} ref="histogram"
		   />
		   <RangeSlider
		      range={this.props.range} selection_range={this.props.srange}
		      onslide={this.slide_handler} ref="slider"
		   />
		</div>
	       );
    }
    
});

/*
 * test function with dummy data
 */
(function() {

    var data = [];
    for (var i = 0; i < 1000; i++) {
	data.push({key: i * 10,
		   doc_count: Math.round(Math.random() * 1000)
		  });
    }
    
    var range = {min: 0, max: 10000};
    var srange = {min: 0, max: 4000};
    var h_margin = {top: 1, bottom: 1, left: 1, right: 1};
    var h_interval = 10;
    
    ReactDOM.render(<RangeFacet range={range} h_margin={h_margin} srange={srange} h_interval="10" h_data={data} />, document.getElementById("range_facet"));

})();
