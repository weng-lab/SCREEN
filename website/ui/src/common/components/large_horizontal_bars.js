const React = require('react');

class LargeHorizontalBars extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<div>
  		    <div ref="loading" className="loading" style={{display: (this.props.loading ? "block" : "none")}}>
		        Loading...
		    </div>
		    <div ref="container" style={{display: (this.props.loading ? "none" : "block"), width: this.props.width + "px"}} />
		</div>);
		
    }

    componentDidMount() {
	this.componentDidUpdate();
    }
    
    componentDidUpdate() {
	if (!this.refs.container.style.display == "block") return;
	$(this.refs.container).empty();
	
	var grid = d3.range(this.props.items.length).map((i) => {
	    return {'x1': 0, 'y1': 0, 'x2': 0, 'y2': this.props.items.length};
	});

	var total_items = 0;
	var labeloffsets = [];
	var yoffsets = {};
	var cmax = 0, d;
	for (var i in this.props.items) {
	    yoffsets[i] = total_items;
	    labeloffsets.push(total_items + (this.props.items[i].items.length / 2.0) + 0.25);
	    total_items += this.props.items[i].items.length;
	    d = d3.max(this.props.items[i].items, this.props.rank_f);
	    if (d > cmax) cmax = d;
	}
	
	var itemsets = this.props.items;
	var rank_f = this.props.rank_f;
	var barheight = +this.props.barheight;
	var height = barheight * total_items + 10;

	var xscale = d3.scale.linear()
	    .domain([-cmax, 0])
	    .range([0, +this.props.width - 150]);

	var yscale = d3.scale.linear()
	    .domain([0, total_items])
	    .range([0, total_items * barheight]);

	var canvas = d3.select(this.refs.container)
	    .append('svg')
	    .attr({'width': +this.props.width, 'height': height})
	    .append('g')
	    .attr({'width': +this.props.width, 'height': height - 10})
	    .attr('transform', 'translate(0,10)');

	var yAxis = d3.svg.axis()
	    .orient('left')
	    .scale(yscale)
	    .tickSize(2)
	    .tickFormat("")
	    .tickValues(d3.range(total_items + 2));

	var y_xis = canvas.append('g')
	    .attr("transform", "translate(150,0)")
	    .attr('id','yaxis')
	    .call(yAxis);

	for (var n in itemsets) {
	    var chart = canvas.append('g')
		.attr("transform", "translate(150," + (yoffsets[n] * barheight) + ")");
	    chart.selectAll('rect')
		.data(itemsets[n].items)
		.enter()
		.append('rect')
		.attr('height', barheight)
		.attr({'x': 0, 'y': (d, i) => (+yscale(i))})
		.style('fill', (d, i) => (itemsets[n].color))
		.attr('width', 0);
	    var transit = chart.selectAll("rect")
		.data(itemsets[n].items)
		.transition()
		.duration(1000)
		.attr("width", (d) => {return +xscale(-rank_f(d))});
	    if (+barheight * 0.75 < 8) continue; // skip drawing text smaller than 12px
	    var transitext = chart.selectAll('text')
		.data(itemsets[n].items)
		.enter()
		.append('text')
		.attr({'x': (d) => (+xscale(-rank_f(d)) + 5), 'y': (d, i) => (+yscale(i) + +barheight * 0.75)})
		.text((d) => (rank_f(d))).style({'fill': '#000', 'font-size': (+barheight * 0.75) + 'px'});
	}
	
	var ylabels = canvas.append('g')
	    .attr("transform", "translate(0,0)")
	    .selectAll('text')
	    .data(Object.keys(itemsets))
	    .enter()
	    .append('text')
	    .attr({'x': 0, 'y': (d, i) => (+yscale(labeloffsets[i]))})
	    .attr("transform", "translate(140,0)")
	    .text((d) => (itemsets[d].name)).style({'fill': '#000', 'font-size': (+barheight < 8 ? 8 : barheight) + "px", "text-anchor": "end"});
	
    }
    
}

export default HorizontalBars;
