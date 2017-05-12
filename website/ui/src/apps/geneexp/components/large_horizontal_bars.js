import React from 'react'

import loading from '../../../common/components/loading'

class BarPlot extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	
	// sort items, prepare formatting functions
	let sorted_keys = Object.keys(this.props.itemsets).sort(
	    (a, b) => (a.toLowerCase().localeCompare(b.toLowerCase()))
	);
	let t0 = (x => (x > 0 ? x : 0));
	let value = (d) => (t0(d[this.props.datascale]));

	// compute bar and label offsets
	let labeloffsets = [];
	let yoffsets = {};
	let total_items = 0;
	let cmax = 0;
	let d = null;
	sorted_keys.map((k) => {
	    yoffsets[k] = total_items;
	    labeloffsets.push(total_items + (
 	        this.props.itemsets[k].items.length / 2.0
	    ) + 0.25);
	    total_items += this.props.itemsets[k].items.length;
	    d = Math.max(...this.props.itemsets[k].items.map(value));
	    if (d > cmax) cmax = d;
	})

	// for coordinate conversion
	let x = ((x) => (x / cmax * +this.props.width * 0.5));
	let y = ((y) => (y * +this.props.barheight))
	let fontsize = +this.props.barheight * 0.75;

	// elements for rendering
	let yaxis = <g transform="translate(200,0)"><path className="domain" d={"M-2,0H0V" + y(total_items) + "H-2"} /></g>;
	let bars = (sorted_keys.map((key, k) => (
	    this.props.itemsets[key].items.map((item, i) => (
		<g transform={"translate(200," + y(yoffsets[key]) + ")"}>
		    <rect height={+this.props.barheight} x="0" y={y(i)} strokeWidth="1" stroke="white"
		        width={x(value(item))} style={{fill: this.props.itemsets[key].color}} />
	            <text x={x(value(item)) + 5} y={y(i) + fontsize} style={{fill: "#000", fontSize: fontsize + "px"}}>{value(item) + " " + item.cellType}</text>
		</g>
	    ))
	)));
	let leftlabels = (sorted_keys.map((key, k) => (
            <text x="0" y={y(labeloffsets[k])} transform="translate(190, 0)"
	        style={{fill: "000", fontSize: +this.props.barheight + "px", textAnchor: "end"}}>{this.props.itemsets[key].displayName}</text>
	)));
	return (<svg width={+this.props.width + 200} height={y(total_items) + 10}>
		<g width={+this.props.width + 200} height={y(total_items) + 10}>
		    <g transform="translate(0,10)" height={y(total_items)} width={this.props.width}>
		        {yaxis}
		        {bars}
			{leftlabels}
                    </g>
		</g>
		</svg>);
	
    }
    
}

class LargeHorizontalBars extends React.Component {

    constructor(props) {
	super(props);
	this.state = {
	    sortorder: "byExpressionTPM",
	    datascale: "logTPM"
	};
    }

    sortSelect(){
         return (
	     <div className="col-md-4">
	         Choose sort order:&nbsp;
	         <select ref="sortorder" defaultValue={"byExpressionTPM"}
	           onChange={() => {this.setState({sortorder: this.refs.sortorder.value})}}>
		     <option value="byExpressionTPM">
                         by expression &#40;TPM&#41;</option>
		     <option value="byExpressionFPKM">
                         by expression &#40;FPKM&#41;</option>
		     <option value="byTissue">
                         by tissue</option>
		     <option value="byTissueMaxTPM">
                         by tissue max &#40;TPM&#41;</option>
		     <option value="byTissueMaxFPKM">
                         by tissue max &#40;FPKM&#41;</option>
	         </select>
	     </div>);
     }

    dataScale(){
        return (
	    <div className="col-md-4">
	        Data:&nbsp;
	        <select ref="datascale" defaultValue={"logTPM"}
	          onChange={() => {this.setState({datascale: this.refs.datascale.value})}}>
		    <option value="logTPM">log2&#40;TPM + 0.01&#41;</option>
		    <option value="rawTPM">TPM</option>
		    <option value="logFPKM">log2&#40;FPKM + 0.01&#41;</option>
		    <option value="rawFPKM">FPKM</option>
	        </select>
	    </div>);
    }

    doRender({isFetching, hasData, width}){
        if(isFetching){
            return loading(this.props);
        }
	if (!hasData){
	    return (
                <div>
                    <br />
		    <h4>No expression data available.</h4>
		</div>);
	}

        return (
            <div style={{display: (isFetching ? "none" : "block")}}>
                <span className="geTissueOfOrigin">Tissue of origin</span>
		<div ref="container" style={{width: width + "px"}}>
		    <BarPlot itemsets={this.props.items[this.state.sortorder]} width={this.props.width}
	                barheight={this.props.barheight} datascale={this.state.datascale} />
		</div>
            </div>);
    }
    
    render() {
	return (
            <div>
	        <div className="row">
                    {this.sortSelect()}
                    {this.dataScale()}
	        </div>

                {this.doRender(this.props)}
            </div>);
    }

    _componentDidMount() {
	this.componentDidUpdate();
    }

    _componentDidUpdate() {
	$(this.refs.container).empty();

	//console.log(this.props);

        if(!this.props.hasData){
            return;
        }

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
	    .attr({'width': +this.props.width + 200, 'height': height})
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
		.attr('width', (d) => {return xscale(rank_f(d))})
	    	.on("click", function(d) {
		    window.open("http://encodeproject.org/" + d["expID"])
		});
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
