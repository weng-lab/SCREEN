function create_histogram(destination_div, data, range, selection_range, interval)
{

    var margin = {top: 1, right: 1, bottom: 1, left: 1};
    var width = $("#" + destination_div.id).width() - margin.left - margin.right;
    var height = $("#" + destination_div.id).height() - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.key; })])
	.rangeRound([0, width]);

    var y = d3.scale.linear()
	.domain([0, d3.max(data, function(d) { return d.doc_count; })])
	.range([height, 0]);

    var svg = d3.select("#" + destination_div.id).append("svg")
	.attr("width", $("#" + destination_div.id).width())
	.attr("height", $("#" + destination_div.id).height())
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("id", destination_div.id + "_svg");

    var bar = svg.selectAll(".bar")
	.data(data)
	.enter().append("g")
	.attr("class", function(d) { return (d.key >= +selection_range.min && d.key < +selection_range.max ? "barselected" : "bardeselected"); })
	.attr("transform", function(d) { return "translate(" + x(d.key) + "," + y(d.doc_count) + ")"; });

    bar.append("rect")
	.attr("x", 1)
	.attr("width", x(interval))
	.attr("height", function(d) { return height - y(d.doc_count); });

    return {"svg": destination_div.id + "_svg", "bins": data};
    
}

function update_histogram_selection(histogram, selection_range)
{

    var svg = d3.select("#" + histogram.svg);
    
    svg.selectAll("g")
        .data(histogram.bins)
        .attr("class", function(d) { return (d.key >= +selection_range.min && d.key < +selection_range.max ? "barselected" : "bardeselected"); });
    
}
