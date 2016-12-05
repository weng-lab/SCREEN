const React = require('react');

var default_colors = ['#005824','#1A693B','#347B53','#4F8D6B','#699F83','#83B09B','#9EC2B3','#B8D4CB','#D2E6E3','#EDF8FB','#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F'];
default_colors.reverse();

var drawDelay = 1000;

import REComponent from './re_component'

export const default_heatmap_layout = {

    "margin": {
	"top": 200,
	"right": 150,
	"bottom": 50,
	"left": 200
    },
    
    "cellSize": 12,

    "rows": {
	"order": [],
	"labels": []
    },
    
    "cols": {
	"order": [],
	"labels": []
    },
    
    "colors": default_colors
    
};

class Heatmap extends REComponent {

    constructor(props) {
	super(props);
	this._default_tooltip = this._default_tooltip.bind(this);
    }

    render() {
	var title = (this.props.title ? this.props.title : "");
	return super.render(<div>
		    <div ref="tooltip" className="heatmap_tooltip heatmap_tooltip_hidden" />
  		    <div ref="loading" className="loading" style={{display: (this.props.loading ? "block" : "none")}}>
		        Loading...
		    </div>
	            <div ref="title" style={{display: (this.props.loading ? "none" : "block"), "fontSize": "18pt"}}>{title}<span ref="help_icon" /></div>
		    <div ref="container" style={{display: (this.props.loading ? "none" : "block")}} />
		    <div ref="order" />
		</div>);
    }

    componentDidMount() {
	super.componentDidMount();
	$(this.refs.tooltip).appendTo(document.body);
	this.componentDidUpdate();
    }

    _default_tooltip(d, rl, cl) {
	return (rl[d.row - 1] + ", " + cl[d.col - 1] + ": " + (Math.round(this._d(d.value) * 1000) / 1000));
    }

    componentDidUpdate() {

	super.componentDidUpdate();
	
	$(this.refs.container).empty();
	
	var data = this.props.data;
	var tooltip = this.refs.tooltip;
	var get_tooltip_text = this.props.tooltip ? this.props.tooltip : this._default_tooltip;
	var _d = this.props.data_transform ? this.props.data_transform : (d) => (d);
	this._d = _d;
	
	if (null == data || 0 == data.length) {
	    return;
	};
	
	var chart_layout = {
	    margin: Object.assign({}, this.props.chart_layout.margin),
	    rows: {
		order: [...this.props.chart_layout.rows.order],
		labels: [...this.props.chart_layout.rows.labels]
	    },
	    cols: {
		order: [...this.props.chart_layout.cols.order],
		labels: [...this.props.chart_layout.cols.labels]
	    },
	    cellSize: this.props.chart_layout.cellSize,
	    colors: [...this.props.chart_layout.colors]
	};
	
	chart_layout.rows.labels = [...this.props.rowlabels];
	chart_layout.rows.styles = (this.props.rowstyles ? [...this.props.rowstyles] : []);
	chart_layout.rows.order = [];
	for (var i = 1; i <= chart_layout.rows.labels.length; i++) chart_layout.rows.order.push(i);

	chart_layout.cols.labels = [...this.props.collabels];
	chart_layout.cols.order = [];
	chart_layout.cols.styles = (this.props.colstyles ? [...this.props.colstyles] : []);
	for (var i = 1; i <= chart_layout.cols.labels.length; i++) chart_layout.cols.order.push(i);

	chart_layout.colors = ['#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F'];
	
	chart_layout.width  = chart_layout.cellSize * chart_layout.cols.order.length;
	chart_layout.height = chart_layout.cellSize * chart_layout.rows.order.length;
	chart_layout.legendElementWidth = chart_layout.cellSize;

	var min = (this.props.min == null ? d3.min(data, function(d) {return d.value;}) : this.props.min);
	var max = (this.props.max == null ? d3.max(data, function(d) {return d.value;}) : this.props.max);
	
	var colorScale = d3.scale.quantile()
	    .domain([min, max])
	    .range(chart_layout.colors);

	var onClick = (row, col) => {if (this.props.onClick) this.props.onClick(row, col);};
	
	var svg = d3.select(this.refs.container).append("svg")
	    .attr("width", chart_layout.width + chart_layout.margin.left + chart_layout.margin.right)
	    .attr("height", chart_layout.height + chart_layout.margin.top + chart_layout.margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + chart_layout.margin.left + "," + chart_layout.margin.top + ")")
	;
	var rowSortOrder=false;
	var colSortOrder=false;
	var order = this.refs.order;
	var rowLabels = svg.append("g")
	    .selectAll(".rowLabelg")
	    .data(chart_layout.rows.labels)
	    .enter()
	    .append("text")
	    .text(function (d) { return d; })
	    .attr("x", 0)
	    .attr("y", function (d, i) { return chart_layout.rows.order.indexOf(i+1) * chart_layout.cellSize; })
	    .style("text-anchor", "end")
	    .style("fill", (d, i) => (i < chart_layout.rows.styles.length ? chart_layout.rows.styles[i] : "#000000"))
	    .attr("transform", "translate(-6," + chart_layout.cellSize / 1.5 + ")")
	    .attr("class", function (d,i) { return "rowLabel mono r"+i;} ) 
	    .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
	    .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
	    .on("click", function(d,i) {rowSortOrder = !rowSortOrder; sortbylabel("r", i, rowSortOrder); d3.select(order).property("selectedIndex", 4).node().focus();;})
	;

	var _angle = 60.0;
	var angle = _angle * Math.PI / 180.0;
	var colLabels = svg.append("g")
	    .selectAll(".colLabelg")
	    .data(chart_layout.cols.labels)
	    .enter()
	    .append("text")
	    .text(function (d) { return d.substring(0, 40) + (d.length > 40 ? "..." : ""); })
	    .attr("x", (d, i) => (chart_layout.cols.order.indexOf(i+1) * chart_layout.cellSize * Math.cos(angle)))
	    .attr("y", (d, i) => (chart_layout.cols.order.indexOf(i+1) * chart_layout.cellSize * Math.sin(angle)))
	    .style("text-anchor", "left")
	    .style("fill", (d, i) => (i < chart_layout.cols.styles.length ? chart_layout.cols.styles[i] : "#000000"))
	    .attr("transform", "translate(" + chart_layout.cellSize / 2 + ",-6) rotate(-" + _angle + ")")
	    .attr("class",  function (d,i) { return "colLabel mono c"+i;} )
	    .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
	    .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
	    .on("click", function(d,i) {colSortOrder = !colSortOrder;  sortbylabel("c",i,colSortOrder); d3.select(order).property("selectedIndex", 4).node().focus();;})
	;

	var heatMap = svg.append("g").attr("class","g3")
	    .selectAll(".cellg")
	    .data(data,function(d){return d.row + ":" + d.col;})
	    .enter()
	    .append("rect")
	    .attr("x", function(d) { return chart_layout.cols.order.indexOf(d.col) * chart_layout.cellSize; })
	    .attr("y", function(d) { return chart_layout.rows.order.indexOf(d.row) * chart_layout.cellSize; })
	    .attr("class", function(d){return "cell cell-border cr"+(d.row-1)+" cc"+(d.col-1);})
	    .attr("width", chart_layout.cellSize)
	    .attr("height", chart_layout.cellSize)
	    .style("fill", function(d) { return colorScale(d.value); })
	    .on("mouseover", function(d){
		//highlight text
		d3.select(this).classed("cell-hover",true);
		svg.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==(d.row-1);});
		svg.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==(d.col-1);});
		
		//Update the tooltip position and value
		d3.select(tooltip)
		    .text(get_tooltip_text(d, chart_layout.rows.labels, chart_layout.cols.labels));
		//Show the tooltip
		d3.select(tooltip).classed("heatmap_tooltip_hidden", false);
	    })
	    .on("mousemove", function(){
		d3.select(tooltip)
		    .style("left", (d3.event.pageX + 10) + "px")
		    .style("top", (d3.event.pageY + 10) + "px")
	    })
	    .on("mouseup", function(d){
		onClick(d.row - 1, d.col - 1);
	    })
	    .on("mouseout", function(){
		d3.select(this).classed("cell-hover",false);
		svg.selectAll(".rowLabel").classed("text-highlight",false);
		svg.selectAll(".colLabel").classed("text-highlight",false);
		d3.select(tooltip).classed("heatmap_tooltip_hidden", true);
	    })
	;
	
	var legend = svg.selectAll(".legend")
	    .data([Math.round(_d(min)), "", "", "", "", "", "", "", "", "", Math.round(_d(max))])
	    .enter().append("g")
	    .attr("class", "legend");
	
	legend.append("rect")
	    .attr("x", function(d, i) { return chart_layout.legendElementWidth * i; })
	    .attr("y", chart_layout.height + (chart_layout.cellSize * 2))
	    .attr("width", chart_layout.legendElementWidth)
	    .attr("height", chart_layout.cellSize)
	    .style("fill", function(d, i) { return chart_layout.colors[i]; });
	
	legend.append("text")
	    .attr("class", "mono")
	    .text(function(d) { return d; })
	    .attr("width", chart_layout.legendElementWidth)
	    .attr("x", function(d, i) { return chart_layout.legendElementWidth * i; })
	    .attr("y", chart_layout.height + (chart_layout.cellSize * 4));
	
	// Change ordering of cells
	
	function sortbylabel(rORc,i,sortOrder){
	    var t = svg.transition().duration(drawDelay);
	    var log2r=[];
	    var sorted; // sorted is zero-based index
	    svg.selectAll(".c"+rORc+i) 
		.filter(function(ce){
		    log2r.push(+ce.value);
		})
	    ;
	    if(rORc=="r"){ // sort log2ratio of a gene
		sorted=d3.range(chart_layout.cols.labels.length).sort((a,b) => ((log2r[b] - log2r[a]) * (sortOrder ? 1 : -1)));
		t.selectAll(".cell")
		    .attr("x", function(d) { return sorted.indexOf(d.col-1) * chart_layout.cellSize; })
		;
		t.selectAll(".colLabel")
		    .attr("y", function (d, i) { return sorted.indexOf(i) * chart_layout.cellSize * Math.sin(angle); })
		    .attr("x", (d, i) => (sorted.indexOf(i) * chart_layout.cellSize * Math.cos(angle)))
		;
	    }else{ // sort log2ratio of a contrast
		sorted=d3.range(chart_layout.rows.labels.length).sort(function(a,b){if(sortOrder){ return log2r[b]-log2r[a];}else{ return log2r[a]-log2r[b];}});
		t.selectAll(".cell")
		    .attr("y", function(d) { return sorted.indexOf(d.row-1) * chart_layout.cellSize; })
		;
		t.selectAll(".rowLabel")
		    .attr("y", function (d, i) { return sorted.indexOf(i) * chart_layout.cellSize; })
		;
	    }
	}
	
	d3.select(order).on("change",function(){
	    order(this.value);
	});
	
	function order(value){
	    if(value=="hclust"){
		var t = svg.transition().duration(drawDelay);
		t.selectAll(".cell")
		    .attr("x", function(d) { return chart_layout.cols.order.indexOf(d.col) * chart_layout.cellSize; })
		    .attr("y", function(d) { return chart_layout.rows.order.indexOf(d.row) * chart_layout.cellSize; })
		;
		
		t.selectAll(".rowLabel")
		    .attr("y", function (d, i) { return chart_layout.rows.order.indexOf(i+1) * chart_layout.cellSize; })
		;
		
		t.selectAll(".colLabel")
		    .attr("y", function (d, i) { return chart_layout.cols.order.indexOf(i+1) * chart_layout.cellSize * Math.sin(angle); })
		    .attr("x", (d, i) => (chart_layout.cols.order.indexOf(i+1) * chart_layout.cellSize * Math.cos(angle)))
		;

	    }else if (value=="probecontrast"){
		var t = svg.transition().duration(drawDelay);
		t.selectAll(".cell")
		    .attr("x", function(d) { return (d.col - 1) * chart_layout.cellSize; })
		    .attr("y", function(d) { return (d.row - 1) *  chart_layout.cellSize; })
		;

		t.selectAll(".rowLabel")
		    .attr("y", function (d, i) { return i *  chart_layout.cellSize; })
		;

		t.selectAll(".colLabel")
		    .attr("y", function (d, i) { return i *  chart_layout.cellSize * Math.sin(angle); })
		    .attr("x", (d, i) => (i * chart_layout.cellSize * Math.cos(angle)))
		;

	    }else if (value=="probe"){
		var t = svg.transition().duration(drawDelay);
		t.selectAll(".cell")
		    .attr("y", function(d) { return (d.row - 1) *  chart_layout.cellSize; })
		;

		t.selectAll(".rowLabel")
		    .attr("y", function (d, i) { return i *  chart_layout.cellSize; })
		;
	    }else if (value=="contrast"){
		var t = svg.transition().duration(drawDelay);
		t.selectAll(".cell")
		    .attr("x", function(d) { return (d.col - 1) *  chart_layout.cellSize; })
		;
		t.selectAll(".colLabel")
		    .attr("y", function (d, i) { return i *  chart_layout.cellSize * Math.sin(angle); })
		    .attr("x", (d, i) => (i * chart_layout.cellSize * Math.cos(angle)))
		;
	    }
	}
    }
}

export default Heatmap;
