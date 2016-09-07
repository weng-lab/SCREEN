var React = require('react');
var ReactDOM = require('react-dom');

var ListItem = React.createClass({

    onclick: function() {
	if (this.props.onclick) this.props.onclick(this.props.k);
    },
    
    render: function() {
	
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

});

var ListFacet = React.createClass({

    getInitialState: function() {
	return {
	    items: this.props.items,
	    selection: this.props.selection
	};
    },
    
    click_handler: function(k) {
	if (k == this.state.selection) k = null;
	this.setState({selection: k});
    },
    
    render: function() {
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
    
});

/*
 * test function with dummy data
 */
(function() {

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
