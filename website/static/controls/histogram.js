function histogram()
{
    this.svg = null;
}

function create_histogram(destination_div, data, range, selection_range, interval)
{

    var retval = new histogram();

    var margin = {top: 1, right: 1, bottom: 1, left: 1};
    retval.div = $("#" + destination_div.id);
    var width = retval.div.width() - margin.left - margin.right;
    var height = retval.div.height() - margin.top - margin.bottom;
    retval.margin = margin;
    
    retval.height = height;
    retval.width = width;
    retval.margin = margin;

    retval.svg = d3.select("#" + destination_div.id).append("svg")
	.attr("width", $("#" + destination_div.id).width())
  	.attr("height", $("#" + destination_div.id).height())
    
    retval.redraw(data, range, selection_range, interval);
    
    return retval;
    
}

histogram.prototype.redraw = function(data, range, selection_range, interval) {

    var xrange = [range.min, range.max];
    var height = this.height;
    this.width = this.div.width();

    this.bins = data;
    
    this.svg.selectAll("*").remove();
    this.svg.append("g")
	.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    
    var x = d3.scale.linear()
        .domain(xrange)
	.rangeRound([0, this.width]);

    var y = d3.scale.linear()
	.domain([0, d3.max(data, function(d) { return d.doc_count; })])
	.range([this.height, 0]);

    var bar = this.svg.selectAll(".bar")
	.data(data)
	.enter().append("g")
	.attr("class", function(d) { return (d.key >= +selection_range.min && d.key < +selection_range.max ? "barselected" : "bardeselected"); })
	.attr("transform", function(d) { return "translate(" + x(d.key) + "," + y(d.doc_count) + ")"; });

    bar.append("rect")
	.attr("x", 1)
	.attr("width", x(interval + xrange[0]))
	.attr("height", function(d) { return height - y(d.doc_count); });
    
};

histogram.prototype.update_selection = function(min, max)
{    
    this.svg.selectAll("g")
        .data(this.bins)
        .attr("class", function(d) { return (d.key >= +min && d.key < +max ? "barselected" : "bardeselected"); });   
}

histogram.prototype.reset = function(data, range, selection_range, interval) {
    this.redraw(data, range, selection_range, interval);
};
