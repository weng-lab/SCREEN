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

    _list_to_tree(list) {
	var nodes = [], l = (list.length + 1) * 2, p;
	for (var i = 0; i < l - 1; ++i) {
	    nodes.push({"name": i, "left": null, "right": null});
	}
	for (var i = list.length - 1; i >= 0; --i) {
	    p = +list[i];
	    nodes[i + list.length + 1].left = nodes[Math.floor(p / l)];
	    nodes[i + list.length + 1].right = nodes[p % l];
	}
	return nodes[nodes.length - 1];
    }

    _tree_depth(tree) {
	var ret = 1, ld = 0, rd = 0;
	if (tree.left) ld = this._tree_depth(tree.left);
	if (tree.right) rd = this._tree_depth(tree.right);
	return ret + (ld > rd ? ld : rd);
    }
    
    _format_for_d3(tree, root_depth) {
	if (tree.left && tree.right) {
	    return {
		name: "",
		children: [
		    this._format_for_d3(tree.left, root_depth - 1),
		    this._format_for_d3(tree.right, root_depth - 1)
		]
	    };
	} else if (root_depth > 0) {
	    return {
		name: "",
		children: [this._format_for_d3(tree, root_depth - 1)]
	    };
	}
	var name = (+tree.name >= 0 && +tree.name < this.props.labels.length
		    ? this.props.labels[+tree.name] : tree.name);
	return {name};
    }
    
    componentDidUpdate() {
	
	if (!this.refs.container.style.display == "block") return;
	$(this.refs.container).empty();
	if (!this.props.data) return;

	console.log(this.props.data);
	var tree = this._list_to_tree(this.props.data);
	var data = this._format_for_d3(tree, this._tree_depth(tree));
	console.log(tree);
	console.log(data);

	var margin = {top: 20, right: 750, bottom: 30, left: 90},
	    width = this.props.width - margin.left - margin.right,
	    height = this.props.height - margin.top - margin.bottom;
	
	// declares a tree layout and assigns the size
	var treemap = d3.tree()
	    .size([height, width]);
	
	//  assigns the data to a hierarchy using parent-child relationships
	var nodes = d3.hierarchy(data, function(d) {
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
