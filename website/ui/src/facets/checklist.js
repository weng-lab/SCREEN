var React = require('react');
var ReactDOM = require('react-dom');

var CheckBox = React.createClass({

    change_handler: function() {
	if (this.props.onchange) this.props.onchange(this.props.k);
    },
    
    render: function() {
	return (this.props.checked
		? <div><input checked ref="box" type="checkbox" onChange={this.change_handler} /> {this.props.value}</div>
		: <div><input ref="box" type="checkbox" onChange={this.change_handler} /> {this.props.value}</div>);
    }

});

var ChecklistFacet = React.createClass({
    
    getInitialState: function() {
	return {items: [], text: ''};
    },
    
    onChange: function(e) {
	this.setState({text: e.target.value});
    },
    
    handleSubmit: function(e) {
	e.preventDefault();
	if ($.trim(this.state.text) == "") return;
	var next_items = this.state.items.concat([{
	    value: this.state.text,
	    checked: true
	}]);
	this.setState({items: next_items, text: ""});
    },

    _clone_items: function() {
	return $.extend(true, {}, this.state.items);
    },
    
    check_handler: function(key) {
	var next_items = this._clone_items();
	next_items[key].checked = !next_items[key].checked;
	console.log(next_items);
	this.setState({items: next_items})
    },
    
    render: function() {

	var items = this.state.items;
	var onchange = this.check_handler;
	var create_item = function(key) {
	    var item = items[key];
	    return <CheckBox key={key} k={key} value={item.value} onchange={onchange} checked={item.checked} />;
	};
	
	return (
		<div>
		   <form onSubmit={this.handleSubmit}>
		      <input onChange={this.onChange} value={this.state.text} />
		      <button>add</button>
		   </form>
		   {Object.keys(this.state.items).map(create_item)}
		</div>
	);
	
    }
    
});

ReactDOM.render(<ChecklistFacet />, document.getElementById("checklist"));
