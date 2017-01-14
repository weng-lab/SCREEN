var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var __jui = require('jquery-ui-bundle');

import AutocompleteTextbox from './autocomplete'
import * as toggleswitch from './toggleswitch'

export const CHECKLIST_MATCH_ALL = 'CHECKLIST_MATCH_ALL';
export const CHECKLIST_MATCH_ANY = 'CHECKLIST_MATCH_ANY';

class CheckBox extends React.Component {

    constructor(props) {
	super(props);
	this.change_handler = this.change_handler.bind(this);
    }

    change_handler() {
	if (this.props.onchange){
            this.props.onchange(this.props.k);
        }
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

	var mode = (this.props.mode ? this.props.mode : CHECKLIST_MATCH_ALL);

	this.state = Object.assign({
	    items: this.props.items,
	    text: "",
	    mode
	});

	this.onChange = this.onChange.bind(this);
	this.handleSubmit = this.handleSubmit.bind(this);
	this.check_handler = this.check_handler.bind(this);
	this.modeChange = this.modeChange.bind(this);
    }

    onChange(e) {
	this.setState({text: e.target.value});
    }

    modeChange() {
	if (this.props.onModeChange) {
            this.props.onModeChange(this.refs.mode.value);
        }
    }

    handleSubmit(e) {
	e.preventDefault();
	if ($.trim(this.state.text) == "") return;
	var next_items = [...this.state.items, {
	    value: this.state.text,
	    checked: true
	}];
	this.setState({items: next_items, text: ""});
	if (this.props.onchange) {
            this.props.onchange(next_items);
        }
    }

    check_handler(key) {
	var next_items = [...this.state.items];
	next_items[key].checked = !next_items[key].checked;
	this.setState({items: next_items});
	if (this.props.onchange) this.props.onchange(next_items);
    }

    componentDidMount() {
	$(this.refs.mode).toggleSwitch({
	    highlight: true,
	    width: 25,
	    change: this.modeChange
	});
    }

    render() {

	var items = this.state.items;
	var onchange = this.check_handler;

	var create_item = function(key) {
	    var item = items[key];
	    return <CheckBox key={key} k={key} value={item.value} onchange={onchange} checked={item.checked} />;
	};

	var checks = (!this.props.match_mode_enabled ? ""
		      : (<div><select ref="mode">
		            <option value={this.props.mode == CHECKLIST_MATCH_ALL} value={CHECKLIST_MATCH_ALL}>match all</option>
		            <option value={this.props.mode == CHECKLIST_MATCH_ANY} value={CHECKLIST_MATCH_ANY}>match any</option>
		         </select></div>
		        ));

	return (<div>
		  <div style={{"fontWeight": "bold"}}>{this.props.title}</div>
		  {checks}
		  <form onSubmit={this.handleSubmit}>
 		    <AutocompleteTextbox source={this.props.autocomplete_source} onChange={this.onChange} value={this.state.text} />
		    <button>add</button>
		  </form>
		  {Object.keys(this.state.items).map(create_item)}
		</div>
	       );
    }
}

export default ChecklistFacet;
