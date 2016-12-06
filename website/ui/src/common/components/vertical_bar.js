const React = require('react');
var d3 = require('d3');

import REComponent from './re_component'

class VerticalBars extends REComponent {

    constructor(props) {
	super(props);
    }

    render() {
	return super.render(<div>
		    <div style={{width: this.props.width + "px", fontSize: "18pt", display: (this.props.loading ? "none" : "block")}}>{this.props.title}<span ref="help_icon" /></div>
		    <div ref="container" style={{display: (this.props.loading ? "none" : "block"), width: this.props.width + "px", height: this.props.height + "px" }} />
		</div>);
		
    }

    componentDidMount() {
	super.componentDidMount();
	this.componentDidUpdate();
    }
    
    componentDidUpdate() {

	super.componentDidUpdate();
	
	if (!this.refs.container.style.display == "block") return;
	$(this.refs.container).empty();
	if (this.props.data.length == 0) return;
	
	var g = d3.select(this.refs.container)
	    .append('svg')
	    .attr("width", this.props.width)
	    .attr("height", this.props.height)
	    .append('g')
	    .attr('width', +this.props.width)
	    .attr('height', +this.props.heigt)
	    .attr('transform', 'translate(0,10)');

	var bg = g.append("g")
	    .attr("transform", "translate(50,0)")
	    .attr("width", this.props.width - 50)
	    .attr("height", this.props.height - 50);
	
	var width = this.props.width - 50;
	var height = this.props.height - 50;

	var x = d3.scaleBand().rangeRound([0, width]).padding(0.1);
	var y = d3.scaleLinear().rangeRound([height, 0]);

	var data = this.props.data;

	data.sort((a, b) => (a.key - b.key));
	x.domain(data.map(function(d) { return d.key; }));
	y.domain([0, d3.max(data, function(d) { return d.value; })]);
	var sep = (data.length == 1 ? width - 50 : (x(data[1].key) - x(data[0].key)));
	
	g.append("g")
	    .attr("class", "axis axis--x")
	    .attr("transform", "translate(50," + height + ")")
	    .call(d3.axisBottom(x))
	    .selectAll("text")
	    .attr("fill", "#fff");

	g.append("g")
	    .attr("transform", "translate(50," + (height + 18) + ")")
	    .attr("font-size", "12")
	    .selectAll('text')
	    .data(this.props.xlabels)
	    .enter()
	    .append('text')
	    .attr('x', (d, i) => (x(data[i].key) + sep / 2))
	    .text((d) => (d))
	    .attr("text-anchor", "middle");

	g.append("g")
	    .attr("class", "axis axis--y")
	    .attr("width", 50)
	    .attr("transform", "translate(50,0)")
	    .call(d3.axisLeft(y).ticks(4))
	    .append("text")
	    .attr("y", 6)
	    .attr("dy", "0.71em")
	    .attr("text-anchor", "end")
	    .text("Frequency");

	bg.selectAll(".bar")
	    .data(data)
	    .enter().append("rect")
	    .attr("class", "bar")
	    .attr("x", function(d) { return x(d.key) + x.bandwidth() * 0.25; })
	    .attr("y", height)
	    .attr("width", x.bandwidth() / 2)
	    .attr("height", 0)
	    .attr("fill", "#393");

	var transit = bg.selectAll("rect")
	    .data(data)
	    .transition()
	    .duration(1000)
	    .attr("y", function(d) { return y(d.value); })
	    .attr("height", function(d) { return height - y(d.value); });
	
    }
    
}
export default VerticalBars;
