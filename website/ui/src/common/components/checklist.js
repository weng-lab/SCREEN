var React = require('react');
var ReactDOM = require('react-dom');

class CheckBox extends React.Component {

    constructor(props) {
	super(props);
	this.change_handler = this.change_handler.bind(this);
    }
    
    change_handler() {
	if (this.props.onchange) this.props.onchange(this.props.k);
    }
    
    render() {
	return (this.props.checked
		? <div><input checked ref="box" type="checkbox" onChange={this.change_handler} /> {this.props.value}</div>
		: <div><input ref="box" type="checkbox" onChange={this.change_handler} /> {this.props.value}</div>);
    }

}

class ChecklistFacet extends React.Component {
    
    constructor(props) {
	super(props);
	this.state = {items: [], text: ''};
	this.onChange = this.onChange.bind(this);
	this.handleSubmit = this.handleSubmit.bind(this);
	this.check_handler = this.check_handler.bind(this);
    }
    
    onChange(e) {
	this.setState({text: e.target.value});
    }
    
    handleSubmit(e) {
	e.preventDefault();
	if ($.trim(this.state.text) == "") return;
	var next_items = [...this.state.items, {
	    value: this.state.text,
	    checked: true
	}];
	this.setState({items: next_items, text: ""});
	if (this.props.onchange) this.props.onchange(next_items);
    }
    
    check_handler(key) {
	var next_items = [...this.state.items];
	next_items[key].checked = !next_items[key].checked;
	this.setState({items: next_items});
	if (this.props.onchange) this.props.onchange(next_items);
    }
    
    render() {

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
    
}
export default ChecklistFacet;
