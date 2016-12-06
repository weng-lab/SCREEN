var React = require('react');
import {connect} from 'react-redux'
var d3 = require('d3');

import {chr_sort} from '../../../common/common'

class HistogramSet extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	if (!this.props.histograms) return <div />;
	var h = this.props.histograms;
	var margin = {top: 10, left: 10, right: 10, bottom: 10};
	var skeys = [...Object.keys(this.props.histograms)].sort(chr_sort);
	return (<div>
		{skeys.map((k) => (!h[k].totals ? "" :
		    <div key={"d_" + k}>
			{k} <Histogram heights={h[k].totals} colors={h[k].corrs} margin={margin} key={"h_" + k} />
                    </div>
		))}
		</div>);
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
	return <div ref="container" style={{height: "40px"}} />;
    }
    
    create_histogram(destination_div) {

	$(destination_div).empty();
	if (!this.props.heights) return;
	
	var div = $(destination_div);
	var height = div.height();
	var width = this.props.heights.length * 3;
	var xrange = [0, this.props.heights.length];
	var colors = this.props.colors;
	
	var svg = d3.select(destination_div).append("svg")
	    .attr("width", width)
	    .attr("height", height);
	
	svg.append("g")
	    .attr("transform", "translate(" + this.props.margin.left + "," + this.props.margin.top + ")");
	
	var x = d3.scaleLinear()
            .domain(xrange)
	    .rangeRound([0, width]);
	
	var y = d3.scaleLinear()
	    .domain([0, d3.max(this.props.heights, (d) => (d))])
	    .range([height, 0]);

	var c = d3.scaleLinear()
	    .domain([0.0, 1.0])
	    .range(["#aaaaaa", "#0000aa"]);
	
	var bar = svg.selectAll(".bar")
	    .data(this.props.heights)
	    .enter().append("g")
	    .attr("transform", function(d, i) { return "translate(" + x(i) + "," + (height / 2 - (height - y(d)) / 2) + ")"; });
	
	bar.append("rect")
	    .attr("x", 1)
	    .attr("width", x(1))
	    .attr("fill", (d, i) => c(colors[i]))
	    .attr("height", function(d) { return height - y(d); });

	return svg;
	
    }
    
}
