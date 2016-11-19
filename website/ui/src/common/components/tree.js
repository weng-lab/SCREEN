const React = require('react');
var d3 = require('d3');

class Tree extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<div>
		    <div style={{width: this.props.width + "px", textAlign: "center", fontSize: "14pt", display: (this.props.loading ? "none" : "block")}}>{this.props.title}</div>
		    <div ref="container" style={{display: (this.props.loading ? "none" : "block"), width: this.props.width + "px", height: this.props.height + "px" }} />
		</div>);
		
    }

    componentDidMount() {
	this.componentDidUpdate();
    }
    
    componentDidUpdate() {
	
	if (!this.refs.container.style.display == "block") return;
	$(this.refs.container).empty();
	if (!this.props.data) return;

	var margin = {top: 20, right: 750, bottom: 30, left: 90},
	    width = this.props.width - margin.left - margin.right,
	    height = this.props.height - margin.top - margin.bottom;
	
	// declares a tree layout and assigns the size
	var treemap = d3.tree()
	    .size([height, width]);
	
	//  assigns the data to a hierarchy using parent-child relationships
	var nodes = d3.hierarchy(this.props.data, function(d) {
	    return d.children;
	});

	// maps the node data to the tree layout, append SVG
	nodes = treemap(nodes);
	var svg = d3.select(this.refs.container).append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom),
	    g = svg.append("g")
	    .attr("transform",
		  "translate(" + margin.left + "," + margin.top + ")");
	
	// adds the links between the nodes
	var link = g.selectAll(".link")
	    .data(nodes.descendants().slice(1))
	    .enter().append("path")
	    .attr("class", "link")
	    .attr("d", function(d) {
		return "M" + d.y + "," + d.x
		    + "C" + (d.y + d.parent.y) / 2 + "," + d.x
		    + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
		    + " " + d.parent.y + "," + d.parent.x;
	    });
	
	// adds each node as a group
	var node = g.selectAll(".node")
	    .data(nodes.descendants())
	    .enter().append("g")
	    .attr("class", function(d) { 
		return "node" + 
		    (d.children && d.children.length != 1 ? " node--internal" : " node--leaf"); })
	    .attr("transform", function(d) { 
		return "translate(" + d.y + "," + d.x + ")"; });

	node.append("path")
	    .style("fill-opacity", (d) => (d.children && d.children.length != 1 ? "1.0" : "0.0"))
	    .attr("d", d3.symbol().size(5));
	
	// adds the text to the node
	node.append("text")
	    .attr("dy", ".35em")
	    .style("text-anchor", function(d) { 
		return d.children ? "end" : "start"; })
	    .text(function(d) { return d.data.name; });
	
    }
    
}
export default Tree;
