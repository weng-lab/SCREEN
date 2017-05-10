const React = require('react');

class HorizontalBars extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<div>
  		    <div ref="loading" className="loading" style={{display: (this.props.loading ? "block" : "none")}}>
		        Loading...
		    </div>
		    <div ref="container" style={{display: (this.props.loading ? "none" : "block"), width: this.props.width + "px"}}>
 		        {_render()}
		    </div>
		</div>);

    }

    componentDidMount() {
	this.componentDidUpdate();
    }

    _render() {
	if(this.refs.container.style.display != "block") {
	    return;
	}
	if(this.props.width < 200){
	    return; // hack to avoid rerender if items not in "view"
	}

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
	var barheight = this.props.barheight;
	var height = barheight * total_items + 10;

	let xscale = (x) => ((x + cmax) * (this.props.width - 150) / cmax);
	let yaxis = <path className="domain" d={"M-2,0H0V" + height + "H-2"}></path>;
	let g = (n, i, width, text) => (<g transform={"translate(200," + (yoffets[n] * barheight) + ")"}>
					    <rect height={barheight} x="0" y={barheight * i}  strokeWidth="1" stroke="white"
					        width={width} style={{fill: itemsets[n].color}}></rect>
					    <text x={width + 5} y={barheight * (i + 0.75)}
					        style={{fill: "rgb(0,0,0)", fontSize: (barheight * 0.75) + "px"}}>{text}</text>
					</g>);
	let lg = (i, text) => (<text x="0" y={labeloffsets[i] * barheight} transform="translate(140,0)"
			           style={{fontSize: barheight + "px", fill: "#000", textAnchor: "end"}}>{text}</text>);
	
	return (<svg width={+this.props.width} height={height}>
		    <g width={+this.props.width} height={height - 10}>
		        {yaxis}
		        {itemsets.map((o, n) => (o.items.map((m, i) => (g(n, i, xscale(-rank_f(m)), rank_f(m))))))}
		        <g transform="translate(0,0)">
		            {itemsets.map((o, i) => (lg(i, o.name)))}
			</g>
		    </g>
		</svg>);
	
	var canvas = d3.select(this.refs.container)
	    .append('svg')
	    .attr({'width': +this.props.width, 'height': height})
	    .append('g')
	    .attr({'width': +this.props.width, 'height': height - 10})
	    .attr('transform', 'translate(0,10)');

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
		.attr("width", (d) => {return xscale(-rank_f(d))});
	    if (+barheight * 0.75 < 8) continue; // skip drawing text smaller than 12px
	    var transitext = chart.selectAll('text')
		.data(itemsets[n].items)
		.enter()
		.append('text')
		.attr({'x': (d) => (xscale(-rank_f(d)) + 5), 'y': (d, i) => (+yscale(i) + +barheight * 0.75)})
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
