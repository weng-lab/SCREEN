var React = require('react');
var ReactDOM = require('react-dom');

class ListItem extends React.Component {

    constructor(props) {
	super(props);
	this.onclick = this.onclick.bind(this);
    }
    
    onclick() {
	if (this.props.onclick) this.props.onclick(this.props.k);
    }
    
    render() {
	
	var classname, rtxt;
	if (this.props.selected) {
	    classname = "result_row_selected";
	    rtxt = <img src="/images/x.png" />;
	} else {
	    classname = "result_row";
	    rtxt = this.props.n;
	}
	
	return (<a onClick={this.onclick}>
		   <div className={classname} style={this.props.style} key={this.props.k}>
		      <span>{this.props.value}</span>
		      <span className="pull-right">{rtxt}</span>
		   </div>
		</a>
	       );
	
    }

}

class ListFacet extends React.Component {

    constructor(props) {
	super(props);
	this.state = {
	    items: this.props.items,
	    selection: this.props.selection
	};
	this.click_handler = this.click_handler.bind(this);
    }
    
    click_handler(k) {
	if (k == this.state.selection) k = null;
	this.setState({selection: k});
	if (this.props.onchange) this.props.onchange();
    }
    
    render() {
	var click_handler = this.click_handler;
	var s = this.state.selection;
	var items = this.state.items;
	var items = Object.keys(items).map(function(key) {
	    var item = items[key];
	    var selected = (key == s);
	    var style = (s == null || selected ? {display: "block"} : {display:"none"});
	    return <ListItem onclick={click_handler} value={item.value} key={key} k={key} n={item.n} selected={selected} style={style} />;
	});
	return <div>{items}</div>;
    }
    
}
export default ListFacet;

/*
 * test function with dummy data
 */
(function() {

    if (!document.getElementById("list_facet")) return;
    
    var items = [
	{
	    value: "K562",
	    n: 10
	},
	{
	    value: "HeLa-S3",
	    n: 20
	},
	{
	    value: "GM12878",
	    n: 100
	}
    ];
    var selection = null;
    
    ReactDOM.render(<ListFacet items={items} selection={selection} />, document.getElementById("list_facet"));

})();
