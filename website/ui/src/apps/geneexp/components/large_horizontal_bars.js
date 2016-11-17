const React = require('react');

class LargeHorizontalBars extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<div>
		   Choose sort order:&nbsp;
		   <select ref="sortorder" onChange={() => {this._reorder(this.refs.sortorder.value)}}>
		       <option value="expression" selected>by expression</option>
		       <option value="tissue">by tissue</option>
		    </select>
  		    <div ref="loading" className="loading" style={{display: (this.props.loading ? "block" : "none")}}>
		        Loading...
		    </div>
		    <div ref="container" style={{display: (this.props.loading ? "none" : "block"), width: this.props.width + "px"}} />
		</div>);
		
    }

    componentDidMount() {
	this.componentDidUpdate();
    }

    _get_tissue_keys(items) {
	
	var tissues = {};
	var retval = [];

	// get tissue groupings
	Object.keys(items).map((k) => {
	    var v = items[k];
	    if (!(v.displayName in tissues)) {
		tissues[v.displayName] = [];
	    }
	    tissues[v.displayName].push(k);
	});

	// append to results list
	Object.keys(tissues).map((k) => {
	    retval = retval.concat(tissues[k]);
	});
	return retval;
	
    }

    _reorder(neworder) {
	
	switch (neworder) {
	case "expression": neworder = this._sorted_keys_keyed; break;
	case "tissue": neworder = this._tissue_keys; break;
	}
	
	var barheight = this.props.barheight;
	var yscale = this._yscale;
	this._bars
	    .data(this._sorted_keys)
	    .transition()
	    .duration(2500)
	    .attr("y", (d, i) => (+yscale(neworder[d])));
	this._transitext
	    .data(this._sorted_keys)
	    .transition()
	    .duration(2500)
	    .attr("y", (d, i) => (+yscale(neworder[d]) + barheight * 0.75));
	this._ylabels
	    .data(this._sorted_keys)
	    .transition()
	    .duration(2500)
	    .attr("y", (d, i) => (+yscale(neworder[d]) + barheight * 0.75));
	
    }
    
    componentDidUpdate() {
	if(this.refs.container.style.display != "block") {
	    return;
	}
	
	$(this.refs.container).empty();
	this.refs.sortorder.value = "expression";
	
	var grid = d3.range(this.props.items.length).map((i) => {
	    return {'x1': 0, 'y1': 0, 'x2': 0, 'y2': this.props.items.length};
	});

	var leftOffset = 200;
	var widthFactor = 0.5;
	var total_items = 0;
	var labeloffsets = [];
	var yoffsets = {};
	var cmax = 0;
	var d;
	var items = this.props.items;

	var sorted_keys = Object.keys(this.props.items).sort(function (a, b) {
	    // from http://stackoverflow.com/a/9645447
	    return a.toLowerCase().localeCompare(b.toLowerCase());
	});
	var tissue_keys = this._get_tissue_keys(this.props.items);
	this._sorted_keys = sorted_keys;
	this._sorted_keys_keyed ={};
	sorted_keys.map((v, i) => {this._sorted_keys_keyed[v] = i;});
	this._tissue_keys = {};
	tissue_keys.map((v, i) => {this._tissue_keys[v] = i;});
	
	for (var i in sorted_keys) {
	    var key = sorted_keys[i];
	    yoffsets[key] = total_items;
	    labeloffsets.push(total_items + (
		this.props.items[key].items.length / 2.0) + 0.25);
	    total_items += this.props.items[key].items.length;
	    d = d3.max(this.props.items[key].items, this.props.rank_f);
	    if (d > cmax) cmax = d;
	}

	var rank_f = this.props.rank_f;
	var subName_f = this.props.subName_f;
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

	var chart = canvas.append('g')
	    .attr("transform", "translate(" + leftOffset + ",0)");
	this._bars = chart.selectAll('rect')
	    .data(sorted_keys)
	    .enter()
	    .append('rect')
	    .attr('height', barheight)
	    .attr({'x': 0, 'y': (d, i) => (+yscale(i))})
	    .style('fill', (d) => (items[d].color))
	    .attr("stroke-width", 1)
	    .attr("stroke", "white")
	    .attr('width', 0);
	var transit = chart.selectAll("rect")
	    .data(sorted_keys)
	    .transition()
	    .duration(1000)
	    .attr("width", (d, i) => (xscale(rank_f(items[d].items[0]))));
	this._transitext = chart.selectAll('text')
	    .data(sorted_keys)
	    .enter()
	    .append('text')
	    .attr({'x': (d) => (xscale(rank_f(items[d].items[0])) + 5),
		   'y': (d, i) => (+yscale(i) + barheight * 0.75)})
	    .text((d) => (rank_f(items[d].items[0]) + " " + subName_f(items[d].items[0]) ))
	    .style({'fill': '#000', 'font-size': (barheight * 0.75) + 'px'});
	
	this._ylabels = canvas.append('g')
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
	this._yscale = yscale;
	
    }
    
}

export default LargeHorizontalBars;
