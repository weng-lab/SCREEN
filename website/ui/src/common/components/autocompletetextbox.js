import React from 'react';
import $ from 'jquery';

class AutocompleteBox extends React.Component {
    
    constructor(props) {
	super(props);
	this.userQueries = {}; // cache
	this.handleKeyPress = this.handleKeyPress.bind(this);
	this._onchange = this._onchange.bind(this);
    }

    handleKeyPress = (event) => {
	if('Enter' === event.key){
	    if (this.props.onEnter){
		this.props.onEnter(this.refs.searchBox.value);
	    }
	}
    }

    _onchange() {
	if (this.props.onChange) {
	    this.props.onChange(this.refs.searchBox.value);
	}
    }
    
    componentDidMount(){
	const loadAuto = (userQuery, callback_f) => {
	    let qobj = {userQuery};
	    if (this.props.assemblies) qobj.assemblies = this.props.assemblies;
	    let jq = JSON.stringify(qobj);
	    if(jq in this.userQueries){
		callback_f(this.userQueries[jq]);
		return;
	    }
	    $.ajax({
		url: "/autows/suggestions",
		type: "POST",
		data: jq,
		dataType: "json",
		contentType : "application/json",
		error: function(jqxhr, status, error) {
                    console.log("err during load");
		},
		success: function(r){
		    this.userQueries[jq] = r;
		    callback_f(r);
		}.bind(this)
	    });
	}

	let sb = $("#" + this.props.id);
	sb.autocomplete({
	    source: function (userQuery, callback_f) {
                // http://stackoverflow.com/a/15977052
                //let endIdx = sb[0].selectionStart;
		loadAuto(userQuery.term, callback_f)
	    },
	    select: function(event, ui) {
		sb.val(ui.item.value);
		return false;
	    },
	    change: function() {
	    }
	});
    }

    render() {
	return <input ref="searchBox" id={this.props.id}
	           type={"text"} defaultValue={this.props.defaultvalue}
	           onKeyPress={this.handleKeyPress} name={this.props.name}
   	           className={this.props.className} size={this.props.size}
  	           onChange={this._onchange} />;
    }
    
}

export default AutocompleteBox;

