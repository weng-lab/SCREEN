var React = require('react');
var ReactDOM = require('react-dom');

var CheckBox = React.createClass({

    getInitialState: function() {
	return {checked: this.props.checked};
    },

    change_handler: function() {
	this.setState({checked: this.refs.box.checked});
	if (this.props.onchange) this.props.onchange();
    },
    
    render: function() {
	return (this.props.checked
		? <div><input checked ref="box" type="checkbox" onChange={this.change_handler} />{this.props.value}</div>
		: <div><input ref="box" type="checkbox" onChange={this.change_handler} />{this.props.value}</div>);
    }

});

    
var CheckList = React.createClass({

    onchange: function() {
	var refs = this.refs;
	this.props.items.map(function(item) {item.checked = refs[item.key].state.checked;});
	if (this.props.onchange) this.props.onchange(this.props.items);
    },
    
    render: function() {
	var onchange = this.onchange;
	var create_item = function(item) {
	    return <CheckBox ref={item.key} key={item.key} value={item.value} onchange={onchange} checked={item.checked} />;
	};
	return <div>{this.props.items.map(create_item)}</div>;
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
	    key: "check_" + this.state.items.length,
	    value: this.state.text,
	    checked: true
	}]);
	this.setState({items: next_items, text: ""});
    },
    
    check_handler: function(items) {
	console.log(items);
	this.setState({items: items})
    },
    
    render: function() {
	return (
		<div>
		   <form onSubmit={this.handleSubmit}>
		      <input onChange={this.onChange} value={this.state.text} />
		      <button>{'Add #' + (this.state.items.length + 1)}</button>
		   </form>
		   <CheckList items={this.state.items} onchange={this.check_handler} />
		</div>
	);
    }
    
});

ReactDOM.render(<ChecklistFacet />, document.getElementById("checklist"));
