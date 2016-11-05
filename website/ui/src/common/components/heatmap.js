const React = require('react');

var default_colors = ['#005824','#1A693B','#347B53','#4F8D6B','#699F83','#83B09B','#9EC2B3','#B8D4CB','#D2E6E3','#EDF8FB','#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F'];
default_colors.reverse();

export const default_heatmap_layout = {

    "margin": {
	"top": 200,
	"right": 10,
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

class Heatmap extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var title = (this.props.title ? this.props.title : "");
	return (<div>
  		    <div ref="loading" className="loading" style={{display: (this.props.loading ? "block" : "none")}}>
		        Loading...
		    </div>
		    <div ref="title" style={{display: (this.props.loading ? "none" : "block")}}><h3>{title}</h3></div>
		    <div ref="container" style={{display: (this.props.loading ? "none" : "block")}} />
		</div>);
		
    }

    componentDidUpdate() {
	
	if (!this.refs.container.style.display == "block") return;

	$(this.refs.container).empty();
	
	var data = this.props.data;

	if (0 == data.length) {
	    return;
	}
	
	var chart_layout = Object.assign({}, this.props.chart_layout);
	
	chart_layout.rows.labels = this.props.rowlabels;
	chart_layout.rows.order = [];
	for (var i = 1; i <= chart_layout.rows.labels.length; i++) chart_layout.rows.order.push(i);

	chart_layout.cols.labels = this.props.collabels;
	chart_layout.cols.order = [];
	for (var i = 1; i <= chart_layout.cols.labels.length; i++) chart_layout.cols.order.push(i);

	chart_layout.colors = ['#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F'];
	
	chart_layout.width  = chart_layout.cellSize * chart_layout.cols.order.length;
	chart_layout.height = chart_layout.cellSize * chart_layout.rows.order.length;
	chart_layout.legendElementWidth = chart_layout.cellSize;

	var min = d3.min(data, function(d) {return d.value;});
	var max = d3.max(data, function(d) {return d.value;});
	
	var colorScale = d3.scale.quantile()
	    .domain([min, max])
	    .range(chart_layout.colors);
	
	var svg = d3.select(this.refs.container).append("svg")
	    .attr("width", chart_layout.width + chart_layout.margin.left + chart_layout.margin.right)
	    .attr("height", chart_layout.height + chart_layout.margin.top + chart_layout.margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + chart_layout.margin.left + "," + chart_layout.margin.top + ")")
	;
	var rowSortOrder=false;
	var colSortOrder=false;
	var rowLabels = svg.append("g")
	    .selectAll(".rowLabelg")
	    .data(chart_layout.rows.labels)
	    .enter()
	    .append("text")
	    .text(function (d) { return d; })
	    .attr("x", 0)
	    .attr("y", function (d, i) { return chart_layout.rows.order.indexOf(i+1) * chart_layout.cellSize; })
	    .style("text-anchor", "end")
	    .attr("transform", "translate(-6," + chart_layout.cellSize / 1.5 + ")")
	    .attr("class", function (d,i) { return "rowLabel mono r"+i;} ) 
	    .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
	    .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
	    .on("click", function(d,i) {rowSortOrder = !rowSortOrder; sortbylabel("r", i, rowSortOrder); d3.select("#order").property("selectedIndex", 4).node().focus();;})
	;

	var colLabels = svg.append("g")
	    .selectAll(".colLabelg")
	    .data(chart_layout.cols.labels)
	    .enter()
	    .append("text")
	    .text(function (d) { return d; })
	    .attr("x", 0)
	    .attr("y", function (d, i) { return chart_layout.cols.order.indexOf(i+1) * chart_layout.cellSize; })
	    .style("text-anchor", "left")
	    .attr("transform", "translate(" + chart_layout.cellSize / 2 + ",-6) rotate (-90)")
	    .attr("class",  function (d,i) { return "colLabel mono c"+i;} )
	    .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
	    .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
	    .on("click", function(d,i) {colSortOrder = !colSortOrder;  sortbylabel("c",i,colSortOrder); d3.select("#order").property("selectedIndex", 4).node().focus();;})
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
		d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==(d.row-1);});
		d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==(d.col-1);});
		
		//Update the tooltip position and value
		d3.select("#tooltip")
		    .style("left", (d3.event.pageX+10) + "px")
		    .style("top", (d3.event.pageY-10) + "px")
		    .select("#value")
		    .text("lables:" + chart_layout.rows.labels[d.row-1] + "," + chart_layout.cols.labels[d.col-1] + "\ndata:" + d.value + "\nrow-col-idx:" + d.col + "," + d.row + "\ncell-xy " + this.x.baseVal.value + ", " + this.y.baseVal.value);  
		//Show the tooltip
		d3.select("#tooltip").classed("hidden", false);
	    })
	    .on("mouseout", function(){
		d3.select(this).classed("cell-hover",false);
		d3.selectAll(".rowLabel").classed("text-highlight",false);
		d3.selectAll(".colLabel").classed("text-highlight",false);
		d3.select("#tooltip").classed("hidden", true);
	    })
	;
	
	var legend = svg.selectAll(".legend")
	    .data([Math.round(min), "", "", "", "", "", "", "", "", "", Math.round(max)])
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
	    var t = svg.transition().duration(3000);
	    var log2r=[];
	    var sorted; // sorted is zero-based index
	    d3.selectAll(".c"+rORc+i) 
		.filter(function(ce){
		    log2r.push(ce.value);
		})
	    ;
	    if(rORc=="r"){ // sort log2ratio of a gene
		sorted=d3.range(chart_layout.cols.labels.length).sort(function(a,b){ if(sortOrder){ return log2r[b]-log2r[a];}else{ return log2r[a]-log2r[b];}});
		t.selectAll(".cell")
		    .attr("x", function(d) { return sorted.indexOf(d.col-1) * chart_layout.cellSize; })
		;
		t.selectAll(".colLabel")
		    .attr("y", function (d, i) { return sorted.indexOf(i) * chart_layout.cellSize; })
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
	
	d3.select("#order").on("change",function(){
	    order(this.value);
	});
	
	function order(value){
	    if(value=="hclust"){
		var t = svg.transition().duration(3000);
		t.selectAll(".cell")
		    .attr("x", function(d) { return chart_layout.cols.order.indexOf(d.col) * chart_layout.cellSize; })
		    .attr("y", function(d) { return chart_layout.rows.order.indexOf(d.row) * chart_layout.cellSize; })
		;
		
		t.selectAll(".rowLabel")
		    .attr("y", function (d, i) { return chart_layout.rows.order.indexOf(i+1) * chart_layout.cellSize; })
		;
		
		t.selectAll(".colLabel")
		    .attr("y", function (d, i) { return chart_layout.cols.order.indexOf(i+1) * chart_layout.cellSize; })
		;

	    }else if (value=="probecontrast"){
		var t = svg.transition().duration(3000);
		t.selectAll(".cell")
		    .attr("x", function(d) { return (d.col - 1) * chart_layout.cellSize; })
		    .attr("y", function(d) { return (d.row - 1) *  chart_layout.cellSize; })
		;

		t.selectAll(".rowLabel")
		    .attr("y", function (d, i) { return i *  chart_layout.cellSize; })
		;

		t.selectAll(".colLabel")
		    .attr("y", function (d, i) { return i *  chart_layout.cellSize; })
		;

	    }else if (value=="probe"){
		var t = svg.transition().duration(3000);
		t.selectAll(".cell")
		    .attr("y", function(d) { return (d.row - 1) *  chart_layout.cellSize; })
		;

		t.selectAll(".rowLabel")
		    .attr("y", function (d, i) { return i *  chart_layout.cellSize; })
		;
	    }else if (value=="contrast"){
		var t = svg.transition().duration(3000);
		t.selectAll(".cell")
		    .attr("x", function(d) { return (d.col - 1) *  chart_layout.cellSize; })
		;
		t.selectAll(".colLabel")
		    .attr("y", function (d, i) { return i *  chart_layout.cellSize; })
		;
	    }
	}
	
	var sa=d3.select(".g3")
	    .on("mousedown", function() {
		if( !d3.event.altKey) {
		    d3.selectAll(".cell-selected").classed("cell-selected",false);
		    d3.selectAll(".rowLabel").classed("text-selected",false);
		    d3.selectAll(".colLabel").classed("text-selected",false);
		}
		var p = d3.mouse(this);
		sa.append("rect")
		    .attr({
			rx      : 0,
			ry      : 0,
			class   : "selection",
			x       : p[0],
			y       : p[1],
			width   : 1,
			height  : 1
		    })
	    })
	    .on("mousemove", function() {
		var s = sa.select("rect.selection");
		
		if(!s.empty()) {
		    var p = d3.mouse(this),
			d = {
			    x       : parseInt(s.attr("x"), 10),
			    y       : parseInt(s.attr("y"), 10),
			    width   : parseInt(s.attr("width"), 10),
			    height  : parseInt(s.attr("height"), 10)
			},
			move = {
			    x : p[0] - d.x,
			    y : p[1] - d.y
			}
		    ;
		    
		    if(move.x < 1 || (move.x*2<d.width)) {
			d.x = p[0];
			d.width -= move.x;
		    } else {
			d.width = move.x;       
		    }
		    
		    if(move.y < 1 || (move.y*2<d.height)) {
			d.y = p[1];
			d.height -= move.y;
		    } else {
			d.height = move.y;       
		    }
		    s.attr(d);
		    
		    // deselect all temporary selected state objects
		    d3.selectAll('.cell-selection.cell-selected').classed("cell-selected", false);
		    d3.selectAll(".text-selection.text-selected").classed("text-selected",false);

		    d3.selectAll('.cell').filter(function(cell_d, i) {
			if(
			    !d3.select(this).classed("cell-selected") && 
				// inner circle inside selection frame
				(this.x.baseVal.value)+ chart_layout.cellSize >= d.x && (this.x.baseVal.value)<=d.x+d.width && 
				(this.y.baseVal.value)+ chart_layout.cellSize >= d.y && (this.y.baseVal.value)<=d.y+d.height
			) {
			    
			    d3.select(this)
				.classed("cell-selection", true)
				.classed("cell-selected", true);

			    d3.select(".r"+(cell_d.row-1))
				.classed("text-selection",true)
				.classed("text-selected",true);

			    d3.select(".c"+(cell_d.col-1))
				.classed("text-selection",true)
				.classed("text-selected",true);
			}
		    });
		}
	    })
	    .on("mouseup", function() {
		// remove selection frame
		sa.selectAll("rect.selection").remove();
		
		// remove temporary selection marker class
		d3.selectAll('.cell-selection').classed("cell-selection", false);
		d3.selectAll(".text-selection").classed("text-selection",false);
	    })
	    .on("mouseout", function() {
		if(d3.event.relatedTarget.tagName=='html') {
		    // remove selection frame
		    sa.selectAll("rect.selection").remove();
		    // remove temporary selection marker class
		    d3.selectAll('.cell-selection').classed("cell-selection", false);
		    d3.selectAll(".rowLabel").classed("text-selected",false);
		    d3.selectAll(".colLabel").classed("text-selected",false);
		}
	    });
	
    }
    
}

export default Heatmap;
