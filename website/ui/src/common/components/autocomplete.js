import React from 'react';
import $ from 'jquery';
let autocomplete = require( "jquery-ui/ui/widgets/autocomplete" );

class AutocompleteTextbox extends React.Component {

    constructor(props) {
	super(props);
	this.onChange = this.onChange.bind(this);
    }

    onChange() {
	if (this.props.onChange) this.props.onChange({
	    "target": this.refs.input
	});
    }
    
    render() {
	return <input type="text"
		      ref="input"
		      onChange={this.onChange}
		      value={this.props.value} />;
    }

    componentDidUpdate() {
	var input = this.refs.input;
	var onChange = this.onChange;
	//console.log($(input));
	autocomplete({
	    source: this.props.source,
	    select: function(event, ui) {
		$(input).val(ui.item.value);
		onChange();
		return false;
	    }
	}, input);
    }
    
};
export default AutocompleteTextbox;
