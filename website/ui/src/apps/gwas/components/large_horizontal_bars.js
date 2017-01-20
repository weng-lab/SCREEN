const React = require('react');

class LargeHorizontalBars extends React.Component {

    constructor(props) {
	super(props);
    }
    
    render() {
	return (<div>

		<div className="container">
		<div className="row">
		<div className="col-md-4">
		Choose sort order:&nbsp;
		<select ref="sortorder" defaultValue={"byExpressionTPM"}
		   onChange={() => {this.componentDidUpdate()}}>
		   <option value="byExpressionTPM">by expression &#40;TPM&#41;</option>
		   <option value="byExpressionFPKM">by expression &#40;FPKM&#41;</option>
		   <option value="byTissue">by tissue</option>
		   <option value="byTissueMaxTPM">by tissue max &#40;TPM&#41;</option>
		   <option value="byTissueMaxFPKM">by tissue max &#40;FPKM&#41;</option>
		</select>
		</div>
		<div className="col-md-4">
		Data:&nbsp;
		<select ref="datascale" defaultValue={"logTPM"}
		   onChange={() => {this.componentDidUpdate()}}>
		   <option value="logTPM">log2&#40;TPM + 0.01&#41;</option>
		   <option value="rawTPM">TPM</option>
		   <option value="logFPKM">log2&#40;FPKM + 0.01&#41;</option>
		   <option value="rawFPKM">FPKM</option>
		</select>
		</div>
		</div>
		</div>
				
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
	if(this.refs.container.style.display != "block") {
	    return;
	}
	
	$(this.refs.container).empty();

	var items = this.props.items[this.refs.sortorder.value];
	var sorted_keys = Object.keys(items).sort(function (a, b) {
	    // from http://stackoverflow.com/a/9645447
	    return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	var rank_f = (d) => {
	    var key = this.refs.datascale.value;
	    var val = d[key];
	    return val >= 0 ? val : 0;
	};
	var subName_f = (d) => (d["cellType"]);
	
	var grid = d3.range(items.length).map((i) => {
	    return {'x1': 0, 'y1': 0, 'x2': 0, 'y2': items.length};
	});

	var leftOffset = 200;
	var widthFactor = 0.5;
	var total_items = 0;
	var labeloffsets = [];
	var yoffsets = {};
	var cmax = 0;
	var d;

	for (var i in sorted_keys) {
	    var key = sorted_keys[i];
	    yoffsets[key] = total_items;
	    labeloffsets.push(total_items + (
		items[key].items.length / 2.0) + 0.25);
	    total_items += items[key].items.length;
	    d = d3.max(items[key].items, rank_f);
	    if (d > cmax) cmax = d;
	}

	var barheight = +this.props.barheight;
	var height = barheight * total_items + 10;

	var xscale = d3.scale.linear()
	    .domain([0, cmax])
	    .range([0, +this.props.width * widthFactor]);

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
	    .attr("transform", "translate(" + leftOffset + ",0)")
	    .attr('id','yaxis')
	    .call(yAxis);

	var toolTip = d3.tip()
	    .attr('class', 'd3-tip')
	    .offset([0, 0])
	    .html(function(d) {
		return "<strong>" + d["cellType"] + "</strong>"+
		    "<div>" + d["tissue"] + "</div>" +
		    "<div>" + '<a href="https://encodeproject.org/experiments/' + d["expID"] + '" target+"_blank">' + d["expID"] + "</a>" + "</div>" +
		    "<div>" + "replicate: " +d["rep"] + "</div>" +
		    "<div>" + "TPM: " + d["rawTPM"] + "</div>" +
		    "<div>" + "FPKM: " + d["rawFPKM"] + "</div>";
	    })
	
	for (var i in sorted_keys) {
	    var key = sorted_keys[i];
	    var itemset = items[key];
	    var chart = canvas.append('g')
		.attr("transform", "translate(" + leftOffset + "," + (yoffsets[key] * barheight) + ")");
	    chart.selectAll('rect')
		.data(itemset.items)
		.enter()
		.append('rect')
		.attr('height', barheight)
		.attr({'x': 0, 'y': (d, i) => (+yscale(i))})
		.style('fill', (d, i) => (itemset.color))
		.attr("stroke-width", 1)
		.attr("stroke", "white")
		.attr('width', 0)
	    	.on("click", function(d) {
		    window.open("http://encodeproject.org/" + d["expID"])
		});
	    var transit = chart.selectAll("rect")
		.data(itemset.items)
		.transition()
		.duration(1000)
		.attr("width", (d) => {return xscale(rank_f(d))});
	    if (barheight * 0.75 < 8) continue; // skip drawing text smaller than 12px
	    var transitext = chart.selectAll('text')
		.data(itemset.items)
		.enter()
		.append('text')
		.attr({'x': (d) => (xscale(rank_f(d)) + 5),
		       'y': (d, i) => (+yscale(i) + barheight * 0.75)})
		.text((d) => (rank_f(d) + " " + subName_f(d) ))
		.style({'fill': '#000', 'font-size': (barheight * 0.75) + 'px'})
		.on("click", function(d) {
		    window.open("http://encodeproject.org/" + d["expID"])
		});
	}
	var ylabels = canvas.append('g')
	    .attr("transform", "translate(0,0)")
	    .selectAll('text')
	    .data(sorted_keys)
	    .enter()
	    .append('text')
	    .attr({'x': 0, 'y': (d, i) => (+yscale(labeloffsets[i]))})
	    .attr("transform", "translate(" + (leftOffset - 10) + ",0)")
	    .text((d) => (items[d].displayName))
	    .style({'fill': '#000',
		    'font-size': (+barheight < 8 ? 8 : barheight) + "px",
		    "text-anchor": "end"});

	d3.selectAll("rect").call(toolTip);
	d3.selectAll("rect")
	    .on('mouseover', toolTip.show)
	    .on('mouseout', toolTip.hide);
    }
}

export default LargeHorizontalBars;
